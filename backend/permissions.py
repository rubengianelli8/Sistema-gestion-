from typing import Dict, List, Set
from models import UserRole
from fastapi import HTTPException, status

# Define permissions structure
class Permission:
    # Productos
    PRODUCTOS_VER = "productos:ver"
    PRODUCTOS_CREAR = "productos:crear"
    PRODUCTOS_EDITAR = "productos:editar"
    PRODUCTOS_ELIMINAR = "productos:eliminar"
    
    # Ventas
    VENTAS_VER = "ventas:ver"
    VENTAS_CREAR = "ventas:crear"
    VENTAS_ANULAR = "ventas:anular"
    
    # Clientes
    CLIENTES_VER = "clientes:ver"
    CLIENTES_CREAR = "clientes:crear"
    CLIENTES_EDITAR = "clientes:editar"
    CLIENTES_ELIMINAR = "clientes:eliminar"
    
    # Presupuestos
    PRESUPUESTOS_VER = "presupuestos:ver"
    PRESUPUESTOS_CREAR = "presupuestos:crear"
    PRESUPUESTOS_EDITAR = "presupuestos:editar"
    PRESUPUESTOS_ELIMINAR = "presupuestos:eliminar"
    PRESUPUESTOS_CONVERTIR = "presupuestos:convertir"
    
    # Usuarios
    USUARIOS_VER = "usuarios:ver"
    USUARIOS_CREAR = "usuarios:crear"
    USUARIOS_EDITAR = "usuarios:editar"
    USUARIOS_ELIMINAR = "usuarios:eliminar"
    
    # Reportes
    REPORTES_VER = "reportes:ver"
    
    # Proveedores
    PROVEEDORES_VER = "proveedores:ver"
    PROVEEDORES_CREAR = "proveedores:crear"
    PROVEEDORES_EDITAR = "proveedores:editar"
    PROVEEDORES_ELIMINAR = "proveedores:eliminar"
    
    # Compras
    COMPRAS_VER = "compras:ver"
    COMPRAS_CREAR = "compras:crear"
    COMPRAS_RECIBIR = "compras:recibir"
    
    # Depósitos
    DEPOSITOS_VER = "depositos:ver"
    DEPOSITOS_CREAR = "depositos:crear"
    DEPOSITOS_EDITAR = "depositos:editar"
    DEPOSITOS_ELIMINAR = "depositos:eliminar"

# Role permissions mapping
ROLE_PERMISSIONS: Dict[UserRole, Set[str]] = {
    UserRole.ADMIN: {
        # Admin tiene todos los permisos
        Permission.PRODUCTOS_VER,
        Permission.PRODUCTOS_CREAR,
        Permission.PRODUCTOS_EDITAR,
        Permission.PRODUCTOS_ELIMINAR,
        Permission.VENTAS_VER,
        Permission.VENTAS_CREAR,
        Permission.VENTAS_ANULAR,
        Permission.CLIENTES_VER,
        Permission.CLIENTES_CREAR,
        Permission.CLIENTES_EDITAR,
        Permission.CLIENTES_ELIMINAR,
        Permission.PRESUPUESTOS_VER,
        Permission.PRESUPUESTOS_CREAR,
        Permission.PRESUPUESTOS_EDITAR,
        Permission.PRESUPUESTOS_ELIMINAR,
        Permission.PRESUPUESTOS_CONVERTIR,
        Permission.USUARIOS_VER,
        Permission.USUARIOS_CREAR,
        Permission.USUARIOS_EDITAR,
        Permission.USUARIOS_ELIMINAR,
        Permission.REPORTES_VER,
        Permission.PROVEEDORES_VER,
        Permission.PROVEEDORES_CREAR,
        Permission.PROVEEDORES_EDITAR,
        Permission.PROVEEDORES_ELIMINAR,
        Permission.COMPRAS_VER,
        Permission.COMPRAS_CREAR,
        Permission.COMPRAS_RECIBIR,
        Permission.DEPOSITOS_VER,
        Permission.DEPOSITOS_CREAR,
        Permission.DEPOSITOS_EDITAR,
        Permission.DEPOSITOS_ELIMINAR,
    },
    UserRole.VENDEDOR: {
        # Vendedor: ventas, clientes, presupuestos completo, productos solo ver
        Permission.PRODUCTOS_VER,
        Permission.VENTAS_VER,
        Permission.VENTAS_CREAR,
        Permission.CLIENTES_VER,
        Permission.CLIENTES_CREAR,
        Permission.CLIENTES_EDITAR,
        Permission.PRESUPUESTOS_VER,
        Permission.PRESUPUESTOS_CREAR,
        Permission.PRESUPUESTOS_EDITAR,
        Permission.PRESUPUESTOS_CONVERTIR,
    },
    UserRole.ALMACENERO: {
        # Almacenero: productos e inventario completo + depósitos + compras
        Permission.PRODUCTOS_VER,
        Permission.PRODUCTOS_CREAR,
        Permission.PRODUCTOS_EDITAR,
        Permission.PRODUCTOS_ELIMINAR,
        Permission.DEPOSITOS_VER,
        Permission.DEPOSITOS_CREAR,
        Permission.DEPOSITOS_EDITAR,
        Permission.COMPRAS_VER,
        Permission.COMPRAS_CREAR,
        Permission.COMPRAS_RECIBIR,
        Permission.PROVEEDORES_VER,
    },
    UserRole.CONTADOR: {
        # Contador: solo lectura de ventas y reportes
        Permission.VENTAS_VER,
        Permission.REPORTES_VER,
        Permission.CLIENTES_VER,
        Permission.PRODUCTOS_VER,
    },
}

def get_user_permissions(role: UserRole) -> Set[str]:
    """Get all permissions for a given role"""
    return ROLE_PERMISSIONS.get(role, set())

def has_permission(user_role: UserRole, required_permission: str) -> bool:
    """Check if a user role has a specific permission"""
    user_permissions = get_user_permissions(user_role)
    return required_permission in user_permissions

def require_permission(user_role: UserRole, required_permission: str):
    """Raise exception if user doesn't have required permission"""
    if not has_permission(user_role, required_permission):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"No tienes permiso para realizar esta acción. Se requiere: {required_permission}"
        )

def get_permissions_list(role: UserRole) -> List[str]:
    """Get permissions as a list for API responses"""
    return list(get_user_permissions(role))
