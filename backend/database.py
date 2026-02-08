from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional, List, Dict, Any
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path
import os

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db: AsyncIOMotorDatabase = client[os.environ['DB_NAME']]

# Collections
users_collection = db.users
products_collection = db.products
categories_collection = db.categories
customers_collection = db.customers
sales_collection = db.sales
quotes_collection = db.quotes
audit_logs_collection = db.audit_logs
warehouses_collection = db.warehouses
suppliers_collection = db.suppliers
supplier_prices_collection = db.supplier_prices
purchases_collection = db.purchases
product_stock_collection = db.product_stock  # Stock por depósito

# Helper functions
def serialize_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Remove MongoDB's _id and convert datetime to ISO format"""
    if doc is None:
        return None
    
    doc.pop('_id', None)
    
    # Convert datetime objects to ISO strings
    for key, value in doc.items():
        if isinstance(value, datetime):
            doc[key] = value.isoformat()
    
    return doc

def serialize_docs(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Serialize a list of documents"""
    return [serialize_doc(doc) for doc in docs]

async def create_indexes():
    """Create database indexes for better performance"""
    # Users indexes
    await users_collection.create_index("email", unique=True)
    await users_collection.create_index("id", unique=True)
    
    # Products indexes
    await products_collection.create_index("id", unique=True)
    await products_collection.create_index("nombre")
    await products_collection.create_index("codigo_barras")
    
    # Categories indexes
    await categories_collection.create_index("id", unique=True)
    
    # Customers indexes
    await customers_collection.create_index("id", unique=True)
    await customers_collection.create_index("email")
    
    # Sales indexes
    await sales_collection.create_index("id", unique=True)
    await sales_collection.create_index("fecha")
    await sales_collection.create_index("vendedor_id")
    
    # Quotes indexes
    await quotes_collection.create_index("id", unique=True)
    await quotes_collection.create_index("fecha")
    
    # Audit logs indexes
    await audit_logs_collection.create_index("timestamp")
    await audit_logs_collection.create_index("usuario_id")
    
    # Warehouses indexes
    await warehouses_collection.create_index("id", unique=True)
    await warehouses_collection.create_index("nombre")
    
    # Suppliers indexes
    await suppliers_collection.create_index("id", unique=True)
    await suppliers_collection.create_index("nombre")
    
    # Supplier prices indexes
    await supplier_prices_collection.create_index("producto_id")
    await supplier_prices_collection.create_index("proveedor_id")
    await supplier_prices_collection.create_index([("producto_id", 1), ("proveedor_id", 1)])
    
    # Purchases indexes
    await purchases_collection.create_index("id", unique=True)
    await purchases_collection.create_index("proveedor_id")
    await purchases_collection.create_index("fecha")
    
    # Product stock indexes
    await product_stock_collection.create_index([("producto_id", 1), ("deposito_id", 1)], unique=True)

async def log_audit(usuario_id: str, usuario_nombre: str, accion: str, modulo: str, detalles: Optional[str] = None):
    """Log an audit entry"""
    from models import AuditLog
    
    log = AuditLog(
        usuario_id=usuario_id,
        usuario_nombre=usuario_nombre,
        accion=accion,
        modulo=modulo,
        detalles=detalles
    )
    
    doc = log.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await audit_logs_collection.insert_one(doc)
