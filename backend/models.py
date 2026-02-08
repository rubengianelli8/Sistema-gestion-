from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    VENDEDOR = "vendedor"
    ALMACENERO = "almacenero"
    CONTADOR = "contador"

class SaleStatus(str, Enum):
    COMPLETADA = "completada"
    PENDIENTE = "pendiente"
    ANULADA = "anulada"

class QuoteStatus(str, Enum):
    PENDIENTE = "pendiente"
    APROBADO = "aprobado"
    RECHAZADO = "rechazado"
    CONVERTIDO = "convertido"

class PaymentMethod(str, Enum):
    EFECTIVO = "efectivo"
    TARJETA = "tarjeta"
    TRANSFERENCIA = "transferencia"

# User Models
class UserBase(BaseModel):
    email: EmailStr
    nombre: str
    rol: UserRole

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    nombre: Optional[str] = None
    rol: Optional[UserRole] = None
    password: Optional[str] = None
    estado: Optional[bool] = None

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    estado: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None

class UserInDB(User):
    password_hash: str

class UserResponse(User):
    pass

# Auth Models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Category Models
class CategoryBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None

class Category(CategoryBase):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Product Models
class ProductBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    codigo_barras: Optional[str] = None
    categoria_id: Optional[str] = None
    precio_minorista: float
    precio_mayorista: float
    stock_actual: int = 0
    stock_minimo: int = 0
    imagen_url: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    codigo_barras: Optional[str] = None
    categoria_id: Optional[str] = None
    precio_minorista: Optional[float] = None
    precio_mayorista: Optional[float] = None
    stock_actual: Optional[int] = None
    stock_minimo: Optional[int] = None
    imagen_url: Optional[str] = None

class Product(ProductBase):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Customer Models
class CustomerBase(BaseModel):
    nombre: str
    dni: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    limite_credito: float = 0.0

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    nombre: Optional[str] = None
    dni: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    limite_credito: Optional[float] = None

class Customer(CustomerBase):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    saldo_cuenta_corriente: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Sale Item
class SaleItem(BaseModel):
    producto_id: str
    producto_nombre: str
    cantidad: int
    precio_unitario: float
    subtotal: float

# Sale Models
class SaleBase(BaseModel):
    cliente_id: Optional[str] = None
    items: List[SaleItem]
    metodo_pago: PaymentMethod
    notas: Optional[str] = None

class SaleCreate(SaleBase):
    pass

class Sale(SaleBase):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vendedor_id: str
    vendedor_nombre: str
    total: float
    estado: SaleStatus = SaleStatus.COMPLETADA
    fecha: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Quote Models
class QuoteItem(BaseModel):
    producto_id: str
    producto_nombre: str
    cantidad: int
    precio_unitario: float
    subtotal: float

class QuoteBase(BaseModel):
    cliente_id: str
    items: List[QuoteItem]
    validez_dias: int = 15
    notas: Optional[str] = None

class QuoteCreate(QuoteBase):
    pass

class QuoteUpdate(BaseModel):
    estado: Optional[QuoteStatus] = None

class Quote(QuoteBase):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vendedor_id: str
    vendedor_nombre: str
    total: float
    estado: QuoteStatus = QuoteStatus.PENDIENTE
    convertido_a_venta_id: Optional[str] = None
    fecha: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Audit Log
class AuditLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    usuario_id: str
    usuario_nombre: str
    accion: str
    modulo: str
    detalles: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Warehouse/Deposito Models
class WarehouseBase(BaseModel):
    nombre: str
    direccion: Optional[str] = None
    encargado: Optional[str] = None
    telefono: Optional[str] = None

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseUpdate(BaseModel):
    nombre: Optional[str] = None
    direccion: Optional[str] = None
    encargado: Optional[str] = None
    telefono: Optional[str] = None
    activo: Optional[bool] = None

class Warehouse(WarehouseBase):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    activo: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Stock por Depósito
class StockWarehouse(BaseModel):
    deposito_id: str
    deposito_nombre: str
    cantidad: int
    ubicacion_interna: Optional[str] = None  # Ej: "Pasillo A - Estante 3"

# Supplier/Proveedor Models
class SupplierBase(BaseModel):
    nombre: str
    contacto: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    cuit: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    nombre: Optional[str] = None
    contacto: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    cuit: Optional[str] = None
    activo: Optional[bool] = None

class Supplier(SupplierBase):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    activo: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Supplier Price Models
class SupplierPriceBase(BaseModel):
    producto_id: str
    producto_nombre: str
    proveedor_id: str
    proveedor_nombre: str
    precio: float
    codigo_proveedor: Optional[str] = None  # Código del producto en el catálogo del proveedor

class SupplierPriceCreate(SupplierPriceBase):
    pass

class SupplierPriceUpdate(BaseModel):
    precio: Optional[float] = None
    codigo_proveedor: Optional[str] = None

class SupplierPrice(SupplierPriceBase):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    fecha_actualizacion: datetime = Field(default_factory=datetime.utcnow)

# Purchase Status
class PurchaseStatus(str, Enum):
    PENDIENTE = "pendiente"
    RECIBIDA = "recibida"
    PARCIAL = "parcial"
    CANCELADA = "cancelada"

# Purchase Item
class PurchaseItem(BaseModel):
    producto_id: str
    producto_nombre: str
    cantidad: int
    precio_unitario: float
    subtotal: float

# Purchase Models
class PurchaseBase(BaseModel):
    proveedor_id: str
    deposito_id: str  # A qué depósito llega la mercadería
    items: List[PurchaseItem]
    numero_factura: Optional[str] = None
    notas: Optional[str] = None

class PurchaseCreate(PurchaseBase):
    pass

class Purchase(PurchaseBase):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    proveedor_nombre: str
    deposito_nombre: str
    total: float
    estado: PurchaseStatus = PurchaseStatus.PENDIENTE
    fecha: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    recibida_por: Optional[str] = None
    fecha_recepcion: Optional[datetime] = None

# Product with Multi-Warehouse Stock
class ProductWithStock(Product):
    stock_depositos: List[StockWarehouse] = []
    stock_total: int = 0
