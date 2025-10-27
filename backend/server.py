from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    role: Literal["admin", "viewer"] = "viewer"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Literal["admin", "viewer"] = "viewer"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class ExchangeRate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    currency: Literal["USD", "EUR"]
    rate: float
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_by: str

class ExchangeRateUpdate(BaseModel):
    currency: Literal["USD", "EUR"]
    rate: float

class RawMaterial(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    entry_date: str
    quantity: float
    unit: Literal["kg", "adet", "litre"]
    price: float
    currency: Literal["TL", "USD", "EUR"]
    total_value: float
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    created_by: str

class RawMaterialCreate(BaseModel):
    name: str
    entry_date: str
    quantity: float
    unit: Literal["kg", "adet", "litre"]
    price: float
    currency: Literal["TL", "USD", "EUR"]

class Production(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str
    machine: Literal["Makine 1", "Makine 2"]
    thickness_mm: float
    width_cm: float
    length_m: float
    square_meters: float
    quantity: int
    masura_model: Literal["100", "120", "150", "200"]
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    created_by: str

class ProductionCreate(BaseModel):
    date: str
    machine: Literal["Makine 1", "Makine 2"]
    thickness_mm: float
    width_cm: float
    length_m: float
    quantity: int
    masura_model: Literal["100", "120", "150", "200"]

class Stock(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    model_name: str
    thickness_mm: float
    width_cm: float
    length_m: float
    square_meters: float
    quantity: int
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Shipment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str
    thickness_mm: float
    width_cm: float
    length_m: float
    square_meters: float
    quantity: int
    customer_name: str
    vehicle_plate: str
    driver_name: str
    departure_time: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    created_by: str

class ShipmentCreate(BaseModel):
    date: str
    thickness_mm: float
    width_cm: float
    length_m: float
    quantity: int
    customer_name: str
    vehicle_plate: str
    driver_name: str
    departure_time: str

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@api_router.get("/")
async def root():
    return {"message": "Fabrika Yönetim API"}

# ============ AUTH ENDPOINTS ============

@api_router.post("/auth/register", response_model=User)
async def register(user_create: UserCreate):
    # Check if any user exists
    existing_count = await db.users.count_documents({})
    
    # First user is always admin
    if existing_count == 0:
        user_create.role = "admin"
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_create.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_dict = user_create.model_dump(exclude={'password'})
    user = User(**user_dict)
    
    doc = user.model_dump()
    doc['password_hash'] = hash_password(user_create.password)
    
    await db.users.insert_one(doc)
    return user

@api_router.post("/auth/login", response_model=Token)
async def login(user_login: UserLogin):
    user_doc = await db.users.find_one({"email": user_login.email}, {"_id": 0})
    if not user_doc or not verify_password(user_login.password, user_doc['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = User(**{k: v for k, v in user_doc.items() if k != 'password_hash'})
    access_token = create_access_token({"sub": user.id})
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ============ USER MANAGEMENT ============

@api_router.get("/users", response_model=List[User])
async def get_users(admin: User = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return [User(**u) for u in users]

@api_router.post("/users", response_model=User)
async def create_user(user_create: UserCreate, admin: User = Depends(get_admin_user)):
    existing = await db.users.find_one({"email": user_create.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    user_dict = user_create.model_dump(exclude={'password'})
    user = User(**user_dict)
    doc = user.model_dump()
    doc['password_hash'] = hash_password(user_create.password)
    
    await db.users.insert_one(doc)
    return user

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: User = Depends(get_admin_user)):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}

# ============ EXCHANGE RATES ============

@api_router.get("/exchange-rates", response_model=List[ExchangeRate])
async def get_exchange_rates(current_user: User = Depends(get_current_user)):
    rates = await db.exchange_rates.find({}, {"_id": 0}).to_list(100)
    return [ExchangeRate(**r) for r in rates]

@api_router.post("/exchange-rates", response_model=ExchangeRate)
async def update_exchange_rate(rate_update: ExchangeRateUpdate, admin: User = Depends(get_admin_user)):
    # Check if rate exists
    existing = await db.exchange_rates.find_one({"currency": rate_update.currency})
    
    rate_dict = rate_update.model_dump()
    rate = ExchangeRate(**rate_dict, updated_by=admin.email)
    doc = rate.model_dump()
    
    if existing:
        await db.exchange_rates.update_one(
            {"currency": rate_update.currency},
            {"$set": doc}
        )
    else:
        await db.exchange_rates.insert_one(doc)
    
    return rate

# ============ RAW MATERIALS ============

@api_router.get("/raw-materials", response_model=List[RawMaterial])
async def get_raw_materials(current_user: User = Depends(get_current_user)):
    materials = await db.raw_materials.find({}, {"_id": 0}).to_list(1000)
    return [RawMaterial(**m) for m in materials]

@api_router.post("/raw-materials", response_model=RawMaterial)
async def create_raw_material(material_create: RawMaterialCreate, admin: User = Depends(get_admin_user)):
    # Calculate total value
    total_value = material_create.quantity * material_create.price
    
    material_dict = material_create.model_dump()
    material = RawMaterial(**material_dict, total_value=total_value, created_by=admin.email)
    doc = material.model_dump()
    
    await db.raw_materials.insert_one(doc)
    return material

@api_router.put("/raw-materials/{material_id}", response_model=RawMaterial)
async def update_raw_material(material_id: str, material_create: RawMaterialCreate, admin: User = Depends(get_admin_user)):
    total_value = material_create.quantity * material_create.price
    
    material_dict = material_create.model_dump()
    material = RawMaterial(id=material_id, **material_dict, total_value=total_value, created_by=admin.email)
    doc = material.model_dump()
    
    result = await db.raw_materials.update_one({"id": material_id}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Material not found")
    
    return material

@api_router.delete("/raw-materials/{material_id}")
async def delete_raw_material(material_id: str, admin: User = Depends(get_admin_user)):
    result = await db.raw_materials.delete_one({"id": material_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Material not found")
    return {"message": "Material deleted"}

# ============ PRODUCTION ============

@api_router.get("/production", response_model=List[Production])
async def get_production(current_user: User = Depends(get_current_user)):
    productions = await db.production.find({}, {"_id": 0}).to_list(1000)
    return [Production(**p) for p in productions]

@api_router.post("/production", response_model=Production)
async def create_production(prod_create: ProductionCreate, admin: User = Depends(get_admin_user)):
    # Calculate square meters: (width_cm / 100) * length_m
    square_meters = (prod_create.width_cm / 100) * prod_create.length_m
    
    prod_dict = prod_create.model_dump()
    production = Production(**prod_dict, square_meters=square_meters, created_by=admin.email)
    doc = production.model_dump()
    
    await db.production.insert_one(doc)
    
    # Update stock
    await update_stock_from_production(production)
    
    return production

@api_router.put("/production/{prod_id}", response_model=Production)
async def update_production(prod_id: str, prod_create: ProductionCreate, admin: User = Depends(get_admin_user)):
    square_meters = (prod_create.width_cm / 100) * prod_create.length_m
    
    prod_dict = prod_create.model_dump()
    production = Production(id=prod_id, **prod_dict, square_meters=square_meters, created_by=admin.email)
    doc = production.model_dump()
    
    result = await db.production.update_one({"id": prod_id}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Production record not found")
    
    # Recalculate stock
    await recalculate_stock()
    
    return production

@api_router.delete("/production/{prod_id}")
async def delete_production(prod_id: str, admin: User = Depends(get_admin_user)):
    result = await db.production.delete_one({"id": prod_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Production record not found")
    
    # Recalculate stock
    await recalculate_stock()
    
    return {"message": "Production deleted"}

async def update_stock_from_production(production: Production):
    model_name = f"{production.thickness_mm}mm x {production.width_cm}cm x {production.length_m}m"
    
    existing = await db.stock.find_one({"model_name": model_name})
    
    if existing:
        new_quantity = existing['quantity'] + production.quantity
        await db.stock.update_one(
            {"model_name": model_name},
            {"$set": {
                "quantity": new_quantity,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    else:
        stock = Stock(
            model_name=model_name,
            thickness_mm=production.thickness_mm,
            width_cm=production.width_cm,
            length_m=production.length_m,
            square_meters=production.square_meters,
            quantity=production.quantity
        )
        await db.stock.insert_one(stock.model_dump())

async def recalculate_stock():
    # Clear existing stock
    await db.stock.delete_many({})
    
    # Recalculate from all production records
    productions = await db.production.find({}, {"_id": 0}).to_list(10000)
    
    stock_dict = {}
    for prod in productions:
        model_name = f"{prod['thickness_mm']}mm x {prod['width_cm']}cm x {prod['length_m']}m"
        
        if model_name in stock_dict:
            stock_dict[model_name]['quantity'] += prod['quantity']
        else:
            stock_dict[model_name] = {
                'model_name': model_name,
                'thickness_mm': prod['thickness_mm'],
                'width_cm': prod['width_cm'],
                'length_m': prod['length_m'],
                'square_meters': prod['square_meters'],
                'quantity': prod['quantity']
            }
    
    # Insert all stock records
    for stock_data in stock_dict.values():
        stock = Stock(**stock_data)
        await db.stock.insert_one(stock.model_dump())

# ============ STOCK ============

@api_router.get("/stock", response_model=List[Stock])
async def get_stock(current_user: User = Depends(get_current_user)):
    stocks = await db.stock.find({}, {"_id": 0}).to_list(1000)
    return [Stock(**s) for s in stocks]

# ============ INCLUDE ROUTER ============

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()