from fastapi import FastAPI, APIRouter, HTTPException, status, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from pathlib import Path
import os
import logging
from typing import Optional, List
from datetime import datetime

# Import local modules
from models import (
    User, UserCreate, UserUpdate, UserResponse, UserInDB, UserRole,
    LoginRequest, TokenResponse,
    Category, CategoryCreate, CategoryUpdate,
    Product, ProductCreate, ProductUpdate,
    Customer, CustomerCreate, CustomerUpdate,
    Sale, SaleCreate,
    Quote, QuoteCreate, QuoteUpdate
)
from auth import hash_password, verify_password, create_access_token, decode_access_token
from permissions import Permission, get_permissions_list, require_permission
from middleware import get_current_user_from_token, get_token_from_header
from database import (
    db, users_collection, serialize_doc, serialize_docs,
    create_indexes, log_audit
)
import routes
import stats

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app
app = FastAPI(title="Sistema Gestión Ferretería")

# Create API router with /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Dependency to get current user from token
async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """Get current authenticated user from token"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se proporcionó token de autenticación"
        )
    
    token = get_token_from_header(authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )
    
    user_data = await get_current_user_from_token(token)
    
    # Get full user from database
    user = await users_collection.find_one({"id": user_data["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado"
        )
    
    if not user.get("estado", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inactivo"
        )
    
    return user

# ===== AUTH ROUTES =====

@api_router.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate):
    """Register a new user"""
    # Check if email already exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Create new user
    password_hash = hash_password(user_data.password)
    
    user = UserInDB(
        **user_data.model_dump(exclude={"password"}),
        password_hash=password_hash
    )
    
    # Convert to dict and serialize datetime
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    user_dict['updated_at'] = user_dict['updated_at'].isoformat()
    if user_dict.get('last_login'):
        user_dict['last_login'] = user_dict['last_login'].isoformat()
    
    # Insert into database
    await users_collection.insert_one(user_dict)
    
    # Return user without password
    return UserResponse(**user.model_dump(exclude={"password_hash"}))

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    """Login user and return JWT token"""
    # Find user by email
    user = await users_collection.find_one({"email": credentials.email}, {"_id": 0})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    # Verify password
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    # Check if user is active
    if not user.get("estado", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inactivo"
        )
    
    # Update last login
    await users_collection.update_one(
        {"id": user["id"]},
        {"$set": {"last_login": datetime.utcnow().isoformat()}}
    )
    
    # Create access token
    access_token = create_access_token(data={
        "sub": user["id"],
        "email": user["email"],
        "rol": user["rol"]
    })
    
    # Log audit
    await log_audit(
        usuario_id=user["id"],
        usuario_nombre=user["nombre"],
        accion="login",
        modulo="auth",
        detalles=f"Login exitoso desde {credentials.email}"
    )
    
    # Return token and user data
    user_response = UserResponse(**{k: v for k, v in user.items() if k != "password_hash"})
    
    return TokenResponse(
        access_token=access_token,
        user=user_response
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(**{k: v for k, v in current_user.items() if k != "password_hash"})

@api_router.get("/auth/permissions")
async def get_user_permissions(current_user: dict = Depends(get_current_user)):
    """Get current user permissions"""
    user_role = UserRole(current_user["rol"])
    permissions = get_permissions_list(user_role)
    
    return {
        "rol": current_user["rol"],
        "permissions": permissions
    }

# ===== USER ROUTES =====

@api_router.get("/users", response_model=List[UserResponse])
async def list_users(current_user: dict = Depends(get_current_user)):
    """List all users (Admin only)"""
    require_permission(UserRole(current_user["rol"]), Permission.USUARIOS_VER)
    
    users = await users_collection.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get user by ID"""
    require_permission(UserRole(current_user["rol"]), Permission.USUARIOS_VER)
    
    user = await users_collection.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return UserResponse(**user)

@api_router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user"""
    require_permission(UserRole(current_user["rol"]), Permission.USUARIOS_EDITAR)
    
    # Check if user exists
    existing_user = await users_collection.find_one({"id": user_id})
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Prepare update data
    update_data = user_update.model_dump(exclude_unset=True)
    
    # Hash password if provided
    if "password" in update_data and update_data["password"]:
        update_data["password_hash"] = hash_password(update_data.pop("password"))
    
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    # Update user
    await users_collection.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    
    # Log audit
    await log_audit(
        usuario_id=current_user["id"],
        usuario_nombre=current_user["nombre"],
        accion="actualizar",
        modulo="usuarios",
        detalles=f"Usuario actualizado: {user_id}"
    )
    
    # Get updated user
    updated_user = await users_collection.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return UserResponse(**updated_user)

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Delete (deactivate) user"""
    require_permission(UserRole(current_user["rol"]), Permission.USUARIOS_ELIMINAR)
    
    # Cannot delete yourself
    if user_id == current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propio usuario"
        )
    
    # Check if user exists
    user = await users_collection.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Deactivate user instead of deleting
    await users_collection.update_one(
        {"id": user_id},
        {"$set": {"estado": False, "updated_at": datetime.utcnow().isoformat()}}
    )
    
    # Log audit
    await log_audit(
        usuario_id=current_user["id"],
        usuario_nombre=current_user["nombre"],
        accion="eliminar",
        modulo="usuarios",
        detalles=f"Usuario desactivado: {user_id}"
    )
    
    return {"message": "Usuario desactivado exitosamente"}

# ===== CATEGORIES ROUTES =====

@api_router.get("/categories", response_model=List[Category])
async def list_categories(current_user: dict = Depends(get_current_user)):
    """List all categories"""
    return await routes.get_categories_list(current_user)

@api_router.post("/categories", response_model=Category, status_code=status.HTTP_201_CREATED)
async def create_category_route(
    category_data: CategoryCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create new category"""
    return await routes.create_category(category_data, current_user)

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category_route(
    category_id: str,
    category_data: CategoryUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update category"""
    return await routes.update_category(category_id, category_data, current_user)

@api_router.delete("/categories/{category_id}")
async def delete_category_route(
    category_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete category"""
    return await routes.delete_category(category_id, current_user)

# ===== PRODUCTS ROUTES =====

@api_router.get("/products", response_model=List[Product])
async def list_products(current_user: dict = Depends(get_current_user)):
    """List all products"""
    return await routes.get_products_list(current_user)

@api_router.get("/products/search")
async def search_products_route(q: str, current_user: dict = Depends(get_current_user)):
    """Search products (autocomplete)"""
    return await routes.search_products(q, current_user)

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product_route(product_id: str, current_user: dict = Depends(get_current_user)):
    """Get product by ID"""
    return await routes.get_product(product_id, current_user)

@api_router.post("/products", response_model=Product, status_code=status.HTTP_201_CREATED)
async def create_product_route(
    product_data: ProductCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create new product"""
    return await routes.create_product(product_data, current_user)

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product_route(
    product_id: str,
    product_data: ProductUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update product"""
    return await routes.update_product(product_id, product_data, current_user)

@api_router.delete("/products/{product_id}")
async def delete_product_route(
    product_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete product"""
    return await routes.delete_product(product_id, current_user)

# ===== CUSTOMERS ROUTES =====

@api_router.get("/customers", response_model=List[Customer])
async def list_customers(current_user: dict = Depends(get_current_user)):
    """List all customers"""
    return await routes.get_customers_list(current_user)

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer_route(customer_id: str, current_user: dict = Depends(get_current_user)):
    """Get customer by ID"""
    return await routes.get_customer(customer_id, current_user)

@api_router.get("/customers/{customer_id}/history")
async def get_customer_history_route(
    customer_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get customer purchase history"""
    return await routes.get_customer_history(customer_id, current_user)

@api_router.post("/customers", response_model=Customer, status_code=status.HTTP_201_CREATED)
async def create_customer_route(
    customer_data: CustomerCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create new customer"""
    return await routes.create_customer(customer_data, current_user)

@api_router.put("/customers/{customer_id}", response_model=Customer)
async def update_customer_route(
    customer_id: str,
    customer_data: CustomerUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update customer"""
    return await routes.update_customer(customer_id, customer_data, current_user)

@api_router.delete("/customers/{customer_id}")
async def delete_customer_route(
    customer_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete customer"""
    return await routes.delete_customer(customer_id, current_user)

# ===== SALES ROUTES =====

@api_router.get("/sales", response_model=List[Sale])
async def list_sales(
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    """List all sales"""
    return await routes.get_sales_list(current_user, limit)

@api_router.get("/sales/{sale_id}", response_model=Sale)
async def get_sale_route(sale_id: str, current_user: dict = Depends(get_current_user)):
    """Get sale by ID"""
    return await routes.get_sale(sale_id, current_user)

@api_router.post("/sales", response_model=Sale, status_code=status.HTTP_201_CREATED)
async def create_sale_route(
    sale_data: SaleCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create new sale"""
    return await routes.create_sale(sale_data, current_user)

@api_router.post("/sales/{sale_id}/anular")
async def anular_sale_route(sale_id: str, current_user: dict = Depends(get_current_user)):
    """Anular (cancel) a sale"""
    return await routes.anular_sale(sale_id, current_user)

# ===== QUOTES ROUTES =====

@api_router.get("/quotes", response_model=List[Quote])
async def list_quotes(current_user: dict = Depends(get_current_user)):
    """List all quotes"""
    return await routes.get_quotes_list(current_user)

@api_router.get("/quotes/{quote_id}", response_model=Quote)
async def get_quote_route(quote_id: str, current_user: dict = Depends(get_current_user)):
    """Get quote by ID"""
    return await routes.get_quote(quote_id, current_user)

@api_router.post("/quotes", response_model=Quote, status_code=status.HTTP_201_CREATED)
async def create_quote_route(
    quote_data: QuoteCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create new quote"""
    return await routes.create_quote(quote_data, current_user)

@api_router.put("/quotes/{quote_id}", response_model=Quote)
async def update_quote_route(
    quote_id: str,
    quote_data: QuoteUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update quote status"""
    return await routes.update_quote_status(quote_id, quote_data, current_user)

@api_router.post("/quotes/{quote_id}/convertir")
async def convert_quote_route(quote_id: str, current_user: dict = Depends(get_current_user)):
    """Convert quote to sale"""
    return await routes.convert_quote_to_sale(quote_id, current_user)

# ===== EXCEL ROUTES =====

from fastapi import UploadFile, File

@api_router.post("/products/import")
async def import_products_route(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Import products from Excel"""
    return await routes.import_products_excel(file, current_user)

@api_router.get("/products/export")
async def export_products_route(current_user: dict = Depends(get_current_user)):
    """Export products to Excel"""
    return await routes.export_products_excel(current_user)

# ===== BACKUP ROUTES =====

@api_router.get("/system/backup")
async def create_backup_route(current_user: dict = Depends(get_current_user)):
    """Create full database backup (Admin only)"""
    return await routes.create_full_backup(current_user)

# ===== DASHBOARD STATS ROUTES =====

@api_router.get("/dashboard/stats")
async def get_dashboard_statistics(current_user: dict = Depends(get_current_user)):
    """Get comprehensive dashboard statistics"""
    return await stats.get_dashboard_stats(current_user)

# ===== HEALTH CHECK =====

@api_router.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "API Sistema Gestión Ferretería",
        "status": "online",
        "version": "1.0.0"
    }

# Include router in app
app.include_router(api_router)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database indexes on startup"""
    logger.info("Creando índices de base de datos...")
    await create_indexes()
    logger.info("Índices creados exitosamente")
    
    # Create default admin user if no users exist
    users_count = await users_collection.count_documents({})
    if users_count == 0:
        logger.info("Creando usuario administrador por defecto...")
        admin_user = UserInDB(
            email="admin@ferreteria.com",
            nombre="Administrador",
            rol=UserRole.ADMIN,
            password_hash=hash_password("admin123"),
            estado=True
        )
        
        admin_dict = admin_user.model_dump()
        admin_dict['created_at'] = admin_dict['created_at'].isoformat()
        admin_dict['updated_at'] = admin_dict['updated_at'].isoformat()
        if admin_dict.get('last_login'):
            admin_dict['last_login'] = admin_dict['last_login'].isoformat()
        
        await users_collection.insert_one(admin_dict)
        logger.info("Usuario administrador creado: admin@ferreteria.com / admin123")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown"""
    from database import client
    client.close()
    logger.info("Conexión a base de datos cerrada")
