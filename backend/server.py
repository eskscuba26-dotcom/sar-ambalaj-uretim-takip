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

# Cutting/Sizing Model
class Cutting(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tarih: str
    production_id: str  # Ana üretim ürünü
    production_name: str  # Ana üretim bilgisi (display için)
    # Ana ürün bilgileri
    ana_kalinlik: float  # mm
    ana_en: float  # cm
    ana_boy: float  # m
    ana_metrekare: float  # m²
    # Ebatlanacak ürün bilgileri
    ebat_kalinlik: float  # mm
    ebat_en: float  # cm
    ebat_boy: float  # cm
    ebat_metrekare: float  # m² (tek parça)
    tek_parça_cikan_adet: int  # Tek ana üründen kaç adet çıkar
    istenen_adet: int  # Kaç adet isteniyor
    tuketilen_ana_urun: float  # Ana üründen kaç adet tüketilecek
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CuttingCreate(BaseModel):
    tarih: str
    production_id: str
    ebat_kalinlik: float
    ebat_en: float
    ebat_boy: float
    istenen_adet: int

class CuttingUpdate(BaseModel):
    tarih: Optional[str] = None
    production_id: Optional[str] = None
    ebat_kalinlik: Optional[float] = None
    ebat_en: Optional[float] = None
    ebat_boy: Optional[float] = None
    istenen_adet: Optional[int] = None

# Stock Model
class Stock(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tarih: str
    tip: str  # "kesilmis" or "kesilmemis"
    model_adi: Optional[str] = None  # Kesilmemiş için
    kalinlik: float  # mm
    en: float  # cm
    boy: float  # m (kesilmemiş) veya cm (kesilmiş)
    metrekare: float  # otomatik
    renk: Optional[str] = None  # Kesilmemiş için
    adet: int
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StockCreate(BaseModel):
    tarih: str
    tip: str
    model_adi: Optional[str] = None
    kalinlik: float
    en: float
    boy: float
    renk: Optional[str] = None
    adet: int

class StockUpdate(BaseModel):
    tarih: Optional[str] = None
    tip: Optional[str] = None
    model_adi: Optional[str] = None
    kalinlik: Optional[float] = None
    en: Optional[float] = None
    boy: Optional[float] = None
    renk: Optional[str] = None
    adet: Optional[int] = None

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

# Production endpoints
@api_router.get("/uretim", response_model=List[Production])
async def get_productions(current_user: User = Depends(get_current_user)):
    productions = await db.productions.find({}, {"_id": 0}).to_list(1000)
    for prod in productions:
        if isinstance(prod.get('created_at'), str):
            prod['created_at'] = datetime.fromisoformat(prod['created_at'])
        if isinstance(prod.get('updated_at'), str):
            prod['updated_at'] = datetime.fromisoformat(prod['updated_at'])
    return productions

@api_router.post("/uretim", response_model=Production)
async def create_production(
    production: ProductionCreate,
    current_user: User = Depends(require_admin)
):
    # Calculate metrekare: (en in cm / 100) * boy in meters
    metrekare = (production.en / 100) * production.boy
    
    production_obj = Production(
        **production.model_dump(),
        metrekare=metrekare,
        created_by=current_user.username
    )
    doc = production_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.productions.insert_one(doc)
    return production_obj

@api_router.put("/uretim/{production_id}", response_model=Production)
async def update_production(
    production_id: str,
    production_update: ProductionUpdate,
    current_user: User = Depends(require_admin)
):
    existing = await db.productions.find_one({"id": production_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Üretim kaydı bulunamadı")
    
    update_data = production_update.model_dump(exclude_unset=True)
    
    # Recalculate metrekare if en or boy changed
    en = update_data.get('en', existing['en'])
    boy = update_data.get('boy', existing['boy'])
    update_data['metrekare'] = (en / 100) * boy
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.productions.update_one({"id": production_id}, {"$set": update_data})
    
    updated = await db.productions.find_one({"id": production_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    
    return Production(**updated)

@api_router.delete("/uretim/{production_id}")
async def delete_production(
    production_id: str,
    current_user: User = Depends(require_admin)
):
    result = await db.productions.delete_one({"id": production_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Üretim kaydı bulunamadı")
    return {"message": "Üretim kaydı silindi"}

# Cutting/Sizing endpoints
@api_router.get("/ebatlama", response_model=List[Cutting])
async def get_cuttings(current_user: User = Depends(get_current_user)):
    cuttings = await db.cuttings.find({}, {"_id": 0}).to_list(1000)
    for cut in cuttings:
        if isinstance(cut.get('created_at'), str):
            cut['created_at'] = datetime.fromisoformat(cut['created_at'])
        if isinstance(cut.get('updated_at'), str):
            cut['updated_at'] = datetime.fromisoformat(cut['updated_at'])
    return cuttings

@api_router.post("/ebatlama", response_model=Cutting)
async def create_cutting(
    cutting: CuttingCreate,
    current_user: User = Depends(require_admin)
):
    # Get production details
    production = await db.productions.find_one({"id": cutting.production_id}, {"_id": 0})
    if not production:
        raise HTTPException(status_code=404, detail="Üretim kaydı bulunamadı")
    
    # Ana ürün metrekaresi
    ana_metrekare = production['metrekare']
    
    # Ebatlanan ürün metrekaresi (cm -> m çevirme)
    ebat_metrekare = (cutting.ebat_en / 100) * (cutting.ebat_boy / 100)
    
    # Tek ana üründen kaç adet çıkar
    tek_parça_cikan_adet = int(ana_metrekare / ebat_metrekare)
    
    # Ana üründen kaç adet tüketilecek
    tuketilen_ana_urun = cutting.istenen_adet / tek_parça_cikan_adet
    
    # Production name için bilgi hazırla
    prod_name = f"{production['kalinlik']}mm x {production['en']}cm x {production['boy']}m = {ana_metrekare:.2f}m²"
    
    cutting_obj = Cutting(
        tarih=cutting.tarih,
        production_id=cutting.production_id,
        production_name=prod_name,
        ana_kalinlik=production['kalinlik'],
        ana_en=production['en'],
        ana_boy=production['boy'],
        ana_metrekare=ana_metrekare,
        ebat_kalinlik=cutting.ebat_kalinlik,
        ebat_en=cutting.ebat_en,
        ebat_boy=cutting.ebat_boy,
        ebat_metrekare=ebat_metrekare,
        tek_parça_cikan_adet=tek_parça_cikan_adet,
        istenen_adet=cutting.istenen_adet,
        tuketilen_ana_urun=tuketilen_ana_urun,
        created_by=current_user.username
    )
    
    doc = cutting_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.cuttings.insert_one(doc)
    return cutting_obj

@api_router.put("/ebatlama/{cutting_id}", response_model=Cutting)
async def update_cutting(
    cutting_id: str,
    cutting_update: CuttingUpdate,
    current_user: User = Depends(require_admin)
):
    existing = await db.cuttings.find_one({"id": cutting_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Ebatlama kaydı bulunamadı")
    
    update_data = cutting_update.model_dump(exclude_unset=True)
    
    # If production changed or ebat values changed, recalculate
    production_id = update_data.get('production_id', existing['production_id'])
    production = await db.productions.find_one({"id": production_id}, {"_id": 0})
    if not production:
        raise HTTPException(status_code=404, detail="Üretim kaydı bulunamadı")
    
    ana_metrekare = production['metrekare']
    ebat_en = update_data.get('ebat_en', existing['ebat_en'])
    ebat_boy = update_data.get('ebat_boy', existing['ebat_boy'])
    istenen_adet = update_data.get('istenen_adet', existing['istenen_adet'])
    
    ebat_metrekare = (ebat_en / 100) * (ebat_boy / 100)
    tek_parça_cikan_adet = int(ana_metrekare / ebat_metrekare)
    tuketilen_ana_urun = istenen_adet / tek_parça_cikan_adet
    
    prod_name = f"{production['kalinlik']}mm x {production['en']}cm x {production['boy']}m = {ana_metrekare:.2f}m²"
    
    update_data.update({
        'production_name': prod_name,
        'ana_kalinlik': production['kalinlik'],
        'ana_en': production['en'],
        'ana_boy': production['boy'],
        'ana_metrekare': ana_metrekare,
        'ebat_metrekare': ebat_metrekare,
        'tek_parça_cikan_adet': tek_parça_cikan_adet,
        'tuketilen_ana_urun': tuketilen_ana_urun,
        'updated_at': datetime.now(timezone.utc).isoformat()
    })
    
    await db.cuttings.update_one({"id": cutting_id}, {"$set": update_data})
    
    updated = await db.cuttings.find_one({"id": cutting_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    
    return Cutting(**updated)

@api_router.delete("/ebatlama/{cutting_id}")
async def delete_cutting(
    cutting_id: str,
    current_user: User = Depends(require_admin)
):
    result = await db.cuttings.delete_one({"id": cutting_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ebatlama kaydı bulunamadı")
    return {"message": "Ebatlama kaydı silindi"}

# Stock endpoints
@api_router.get("/stok", response_model=List[Stock])
async def get_stocks(current_user: User = Depends(get_current_user)):
    stocks = await db.stocks.find({}, {"_id": 0}).to_list(1000)
    for stock in stocks:
        if isinstance(stock.get('created_at'), str):
            stock['created_at'] = datetime.fromisoformat(stock['created_at'])
        if isinstance(stock.get('updated_at'), str):
            stock['updated_at'] = datetime.fromisoformat(stock['updated_at'])
    return stocks

@api_router.post("/stok", response_model=Stock)
async def create_stock(
    stock: StockCreate,
    current_user: User = Depends(require_admin)
):
    # Calculate metrekare based on tip
    if stock.tip == "kesilmemis":
        # boy in meters
        metrekare = (stock.en / 100) * stock.boy
    else:  # kesilmis
        # boy in cm
        metrekare = (stock.en / 100) * (stock.boy / 100)
    
    stock_obj = Stock(
        **stock.model_dump(),
        metrekare=metrekare,
        created_by=current_user.username
    )
    
    doc = stock_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.stocks.insert_one(doc)
    return stock_obj

@api_router.put("/stok/{stock_id}", response_model=Stock)
async def update_stock(
    stock_id: str,
    stock_update: StockUpdate,
    current_user: User = Depends(require_admin)
):
    existing = await db.stocks.find_one({"id": stock_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Stok kaydı bulunamadı")
    
    update_data = stock_update.model_dump(exclude_unset=True)
    
    # Recalculate metrekare if dimensions changed
    tip = update_data.get('tip', existing['tip'])
    en = update_data.get('en', existing['en'])
    boy = update_data.get('boy', existing['boy'])
    
    if tip == "kesilmemis":
        metrekare = (en / 100) * boy
    else:
        metrekare = (en / 100) * (boy / 100)
    
    update_data['metrekare'] = metrekare
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.stocks.update_one({"id": stock_id}, {"$set": update_data})
    
    updated = await db.stocks.find_one({"id": stock_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    
    return Stock(**updated)

@api_router.delete("/stok/{stock_id}")
async def delete_stock(
    stock_id: str,
    current_user: User = Depends(require_admin)
):
    result = await db.stocks.delete_one({"id": stock_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Stok kaydı bulunamadı")
    return {"message": "Stok kaydı silindi"}

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