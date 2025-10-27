from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET', 'sar-ambalaj-secret-key-2025')
ALGORITHM = "HS256"

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str
    role: str  # "admin" or "viewer"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class RawMaterial(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tarih: str  # Date in ISO format
    malzeme: str
    birim: str  # "kg", "adet", "litre"
    miktar: float
    para_birimi: str  # "TL", "USD", "EUR"
    birim_fiyat: float
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RawMaterialCreate(BaseModel):
    tarih: str
    malzeme: str
    birim: str
    miktar: float
    para_birimi: str
    birim_fiyat: float

class RawMaterialUpdate(BaseModel):
    tarih: Optional[str] = None
    malzeme: Optional[str] = None
    birim: Optional[str] = None
    miktar: Optional[float] = None
    para_birimi: Optional[str] = None
    birim_fiyat: Optional[float] = None

# Exchange Rate Model
class ExchangeRate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tarih: str  # Date in ISO format
    usd: float  # USD to TL rate
    eur: float  # EUR to TL rate
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ExchangeRateCreate(BaseModel):
    tarih: str
    usd: float
    eur: float

class ExchangeRateUpdate(BaseModel):
    tarih: Optional[str] = None
    usd: Optional[float] = None
    eur: Optional[float] = None

# Production Model
class Production(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tarih: str
    makine: str  # "Makine 1" or "Makine 2"
    kalinlik: float  # mm
    en: float  # cm
    boy: float  # metre
    metrekare: float  # auto calculated
    adet: int
    masura_tipi: str
    renk: str  # malzeme adı veya "Renksiz"
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductionCreate(BaseModel):
    tarih: str
    makine: str
    kalinlik: float
    en: float
    boy: float
    adet: int
    masura_tipi: str
    renk: str

class ProductionUpdate(BaseModel):
    tarih: Optional[str] = None
    makine: Optional[str] = None
    kalinlik: Optional[float] = None
    en: Optional[float] = None
    boy: Optional[float] = None
    adet: Optional[int] = None
    masura_tipi: Optional[str] = None
    renk: Optional[str] = None

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin yetkisi gerekli")
    return current_user

# Auth endpoints
@api_router.post("/auth/login", response_model=Token)
async def login(user_login: UserLogin):
    user = await db.users.find_one({"username": user_login.username}, {"_id": 0})
    if not user or not verify_password(user_login.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Kullanıcı adı veya şifre hatalı")
    
    access_token = create_access_token(data={"sub": user["id"], "role": user["role"]})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"]
        }
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        role=current_user.role
    )

# Initialize admin user
@api_router.post("/auth/init-admin")
async def init_admin():
    existing = await db.users.find_one({"username": "admin"})
    if existing:
        return {"message": "Admin kullanıcı zaten mevcut"}
    
    admin = User(
        username="admin",
        password_hash=get_password_hash("admin123"),
        role="admin"
    )
    doc = admin.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    return {"message": "Admin kullanıcı oluşturuldu. Username: admin, Password: admin123"}

# User Management endpoints (Admin only)
class UserCreate(BaseModel):
    username: str
    password: str
    role: str

class UserUpdateAdmin(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(current_user: User = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return [UserResponse(**u) for u in users]

@api_router.post("/users", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(require_admin)
):
    # Check if username already exists
    existing = await db.users.find_one({"username": user_data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten kullanılıyor")
    
    if user_data.role not in ["admin", "viewer"]:
        raise HTTPException(status_code=400, detail="Geçersiz rol")
    
    new_user = User(
        username=user_data.username,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role
    )
    doc = new_user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    return UserResponse(
        id=new_user.id,
        username=new_user.username,
        role=new_user.role
    )

@api_router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_update: UserUpdateAdmin,
    current_user: User = Depends(require_admin)
):
    existing = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    update_data = {}
    if user_update.username:
        # Check if new username is taken
        username_taken = await db.users.find_one({
            "username": user_update.username,
            "id": {"$ne": user_id}
        })
        if username_taken:
            raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten kullanılıyor")
        update_data["username"] = user_update.username
    
    if user_update.password:
        update_data["password_hash"] = get_password_hash(user_update.password)
    
    if user_update.role:
        if user_update.role not in ["admin", "viewer"]:
            raise HTTPException(status_code=400, detail="Geçersiz rol")
        update_data["role"] = user_update.role
    
    if update_data:
        await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    updated = await db.users.find_one({"id": user_id}, {"_id": 0})
    return UserResponse(
        id=updated["id"],
        username=updated["username"],
        role=updated["role"]
    )

@api_router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(require_admin)
):
    # Prevent deleting yourself
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Kendi hesabınızı silemezsiniz")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    return {"message": "Kullanıcı silindi"}

# Raw Material endpoints
@api_router.get("/hammadde", response_model=List[RawMaterial])
async def get_raw_materials(current_user: User = Depends(get_current_user)):
    materials = await db.raw_materials.find({}, {"_id": 0}).to_list(1000)
    for mat in materials:
        if isinstance(mat.get('created_at'), str):
            mat['created_at'] = datetime.fromisoformat(mat['created_at'])
        if isinstance(mat.get('updated_at'), str):
            mat['updated_at'] = datetime.fromisoformat(mat['updated_at'])
    return materials

@api_router.post("/hammadde", response_model=RawMaterial)
async def create_raw_material(
    material: RawMaterialCreate,
    current_user: User = Depends(require_admin)
):
    material_obj = RawMaterial(
        **material.model_dump(),
        created_by=current_user.username
    )
    doc = material_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.raw_materials.insert_one(doc)
    return material_obj

@api_router.put("/hammadde/{material_id}", response_model=RawMaterial)
async def update_raw_material(
    material_id: str,
    material_update: RawMaterialUpdate,
    current_user: User = Depends(require_admin)
):
    existing = await db.raw_materials.find_one({"id": material_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Hammadde bulunamadı")
    
    update_data = material_update.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.raw_materials.update_one({"id": material_id}, {"$set": update_data})
    
    updated = await db.raw_materials.find_one({"id": material_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    
    return RawMaterial(**updated)

@api_router.delete("/hammadde/{material_id}")
async def delete_raw_material(
    material_id: str,
    current_user: User = Depends(require_admin)
):
    result = await db.raw_materials.delete_one({"id": material_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Hammadde bulunamadı")
    return {"message": "Hammadde silindi"}

# Exchange Rate endpoints
@api_router.get("/kurlar", response_model=List[ExchangeRate])
async def get_exchange_rates(current_user: User = Depends(get_current_user)):
    rates = await db.exchange_rates.find({}, {"_id": 0}).to_list(1000)
    for rate in rates:
        if isinstance(rate.get('created_at'), str):
            rate['created_at'] = datetime.fromisoformat(rate['created_at'])
        if isinstance(rate.get('updated_at'), str):
            rate['updated_at'] = datetime.fromisoformat(rate['updated_at'])
    return rates

@api_router.get("/kurlar/latest")
async def get_latest_exchange_rates(current_user: User = Depends(get_current_user)):
    # Get the most recent exchange rate
    rates = await db.exchange_rates.find({}, {"_id": 0}).sort("tarih", -1).limit(1).to_list(1)
    if not rates:
        return {"usd": 1.0, "eur": 1.0}  # Default rates if none exist
    return {"usd": rates[0]["usd"], "eur": rates[0]["eur"]}

@api_router.post("/kurlar", response_model=ExchangeRate)
async def create_exchange_rate(
    rate: ExchangeRateCreate,
    current_user: User = Depends(require_admin)
):
    rate_obj = ExchangeRate(
        **rate.model_dump(),
        created_by=current_user.username
    )
    doc = rate_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.exchange_rates.insert_one(doc)
    return rate_obj

@api_router.put("/kurlar/{rate_id}", response_model=ExchangeRate)
async def update_exchange_rate(
    rate_id: str,
    rate_update: ExchangeRateUpdate,
    current_user: User = Depends(require_admin)
):
    existing = await db.exchange_rates.find_one({"id": rate_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Kur bulunamadı")
    
    update_data = rate_update.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.exchange_rates.update_one({"id": rate_id}, {"$set": update_data})
    
    updated = await db.exchange_rates.find_one({"id": rate_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    
    return ExchangeRate(**updated)

@api_router.delete("/kurlar/{rate_id}")
async def delete_exchange_rate(
    rate_id: str,
    current_user: User = Depends(require_admin)
):
    result = await db.exchange_rates.delete_one({"id": rate_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kur bulunamadı")
    return {"message": "Kur silindi"}

# Include router
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