import { UserRole } from "@prisma/client";

export enum Permission {
  // Usuarios
  USUARIOS_VER = "usuarios:ver",
  USUARIOS_CREAR = "usuarios:crear",
  USUARIOS_EDITAR = "usuarios:editar",
  USUARIOS_ELIMINAR = "usuarios:eliminar",

  // Productos
  PRODUCTOS_VER = "productos:ver",
  PRODUCTOS_CREAR = "productos:crear",
  PRODUCTOS_EDITAR = "productos:editar",
  PRODUCTOS_ELIMINAR = "productos:eliminar",

  // Clientes
  CLIENTES_VER = "clientes:ver",
  CLIENTES_CREAR = "clientes:crear",
  CLIENTES_EDITAR = "clientes:editar",
  CLIENTES_ELIMINAR = "clientes:eliminar",

  // Ventas
  VENTAS_VER = "ventas:ver",
  VENTAS_CREAR = "ventas:crear",
  VENTAS_ANULAR = "ventas:anular",

  // Presupuestos
  PRESUPUESTOS_VER = "presupuestos:ver",
  PRESUPUESTOS_CREAR = "presupuestos:crear",
  PRESUPUESTOS_EDITAR = "presupuestos:editar",
  PRESUPUESTOS_CONVERTIR = "presupuestos:convertir",

  // Depósitos
  DEPOSITOS_VER = "depositos:ver",
  DEPOSITOS_CREAR = "depositos:crear",
  DEPOSITOS_EDITAR = "depositos:editar",
  DEPOSITOS_ELIMINAR = "depositos:eliminar",

  // Proveedores
  PROVEEDORES_VER = "proveedores:ver",
  PROVEEDORES_CREAR = "proveedores:crear",
  PROVEEDORES_EDITAR = "proveedores:editar",
  PROVEEDORES_ELIMINAR = "proveedores:eliminar",

  // Compras
  COMPRAS_VER = "compras:ver",
  COMPRAS_CREAR = "compras:crear",
  COMPRAS_RECIBIR = "compras:recibir",
}

// Mapeo de roles a permisos
const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Admin tiene todos los permisos
    Permission.USUARIOS_VER,
    Permission.USUARIOS_CREAR,
    Permission.USUARIOS_EDITAR,
    Permission.USUARIOS_ELIMINAR,
    Permission.PRODUCTOS_VER,
    Permission.PRODUCTOS_CREAR,
    Permission.PRODUCTOS_EDITAR,
    Permission.PRODUCTOS_ELIMINAR,
    Permission.CLIENTES_VER,
    Permission.CLIENTES_CREAR,
    Permission.CLIENTES_EDITAR,
    Permission.CLIENTES_ELIMINAR,
    Permission.VENTAS_VER,
    Permission.VENTAS_CREAR,
    Permission.VENTAS_ANULAR,
    Permission.PRESUPUESTOS_VER,
    Permission.PRESUPUESTOS_CREAR,
    Permission.PRESUPUESTOS_EDITAR,
    Permission.PRESUPUESTOS_CONVERTIR,
    Permission.DEPOSITOS_VER,
    Permission.DEPOSITOS_CREAR,
    Permission.DEPOSITOS_EDITAR,
    Permission.DEPOSITOS_ELIMINAR,
    Permission.PROVEEDORES_VER,
    Permission.PROVEEDORES_CREAR,
    Permission.PROVEEDORES_EDITAR,
    Permission.PROVEEDORES_ELIMINAR,
    Permission.COMPRAS_VER,
    Permission.COMPRAS_CREAR,
    Permission.COMPRAS_RECIBIR,
  ],
  [UserRole.VENDEDOR]: [
    Permission.PRODUCTOS_VER,
    Permission.CLIENTES_VER,
    Permission.CLIENTES_CREAR,
    Permission.CLIENTES_EDITAR,
    Permission.VENTAS_VER,
    Permission.VENTAS_CREAR,
    Permission.PRESUPUESTOS_VER,
    Permission.PRESUPUESTOS_CREAR,
    Permission.PRESUPUESTOS_EDITAR,
    Permission.PRESUPUESTOS_CONVERTIR,
  ],
  [UserRole.ALMACENERO]: [
    Permission.PRODUCTOS_VER,
    Permission.PRODUCTOS_CREAR,
    Permission.PRODUCTOS_EDITAR,
    Permission.DEPOSITOS_VER,
    Permission.DEPOSITOS_CREAR,
    Permission.DEPOSITOS_EDITAR,
    Permission.PROVEEDORES_VER,
    Permission.PROVEEDORES_CREAR,
    Permission.PROVEEDORES_EDITAR,
    Permission.COMPRAS_VER,
    Permission.COMPRAS_CREAR,
    Permission.COMPRAS_RECIBIR,
  ],
  [UserRole.CONTADOR]: [
    Permission.PRODUCTOS_VER,
    Permission.CLIENTES_VER,
    Permission.VENTAS_VER,
    Permission.PRESUPUESTOS_VER,
    Permission.COMPRAS_VER,
  ],
};

/**
 * Get permissions list for a role
 */
export function getPermissionsList(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = getPermissionsList(role);
  return permissions.includes(permission);
}

/**
 * Require a permission, throw error if not authorized
 */
export function requirePermission(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`No tienes permiso para realizar esta acción: ${permission}`);
  }
}

