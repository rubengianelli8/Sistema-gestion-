# Venta Agil - PRD

## Descripción General

Sistema SaaS de gestión integral para negocios con funcionalidades de punto de venta, inventario multi-depósito, gestión de proveedores y compras.

## Stack Tecnológico

- **Backend:** FastAPI, MongoDB (motor async), Pydantic, JWT Auth
- **Frontend:** React, React Router, Axios, Tailwind CSS, Shadcn/UI, Recharts
- **Autenticación:** JWT con roles (Admin, Vendedor, Almacenero, Contador)

## Módulos Implementados

### 1. Autenticación y Usuarios

- Login con email/contraseña
- Gestión de usuarios con roles y permisos
- Sesiones con JWT

### 2. Productos y Categorías

- CRUD completo de productos
- Búsqueda autocompletada
- Código de barras
- Generación de códigos QR para productos sin código de barras
- Importación/exportación Excel

### 3. Clientes

- CRUD con DNI y email opcional
- Historial de compras

### 4. Punto de Venta (POS)

- Registro de ventas
- Escáner de código de barras (cámara móvil)
- Lectura de códigos QR generados por el sistema
- Generación de tickets PDF

### 5. Presupuestos

- Crear y convertir a venta
- Estados: pendiente, aprobado, rechazado

### 6. Dashboard

- Estadísticas de ventas
- Gráficos con Recharts
- Alertas de stock bajo

### 7. Multi-Depósitos (NUEVO - Dic 2024)

- Gestión de múltiples almacenes
- Stock por ubicación
- Transferencias entre depósitos

### 8. Proveedores (NUEVO - Dic 2024)

- CRUD de proveedores
- Listas de precios por proveedor
- Importación de precios desde Excel

### 9. Órdenes de Compra (NUEVO - Dic 2024)

- Crear órdenes a proveedores
- Selección de depósito destino
- Recepción con actualización automática de stock

## APIs Backend Principales

- `/api/auth/*` - Autenticación
- `/api/users/*` - Usuarios
- `/api/products/*` - Productos
- `/api/categories/*` - Categorías
- `/api/customers/*` - Clientes
- `/api/sales/*` - Ventas
- `/api/quotes/*` - Presupuestos
- `/api/warehouses/*` - Depósitos
- `/api/suppliers/*` - Proveedores
- `/api/purchases/*` - Compras
- `/api/dashboard/stats` - Estadísticas

## Credenciales de Prueba

- **Admin:** admin@ferreteria.com / admin123
- **Vendedor:** vendedor@ferreteria.com / vendedor123
- **Almacenero:** almacenero@ferreteria.com / almacenero123
- **Contador:** contador@ferreteria.com / contador123

---

## Tareas Completadas (Diciembre 2024)

### Sesión Actual

- [x] Implementar frontend para módulo Depósitos
- [x] Implementar frontend para módulo Proveedores
- [x] Implementar frontend para módulo Compras (Órdenes de Compra)
- [x] Actualizar rutas en App.js
- [x] Agregar enlaces en Sidebar
- [x] Fix: precio NaN en formulario de compras
- [x] Comparativa de precios entre proveedores
- [x] Generación de códigos QR para productos
- [x] Integración QR en escáner del POS
- [x] Testing completo con 100% de éxito

---

## Backlog Priorizado

### P1 - Alta Prioridad

- [x] Comparativa de precios entre proveedores en UI (Dic 2024)
- [ ] Integrar multi-depósito en módulo Productos (mostrar stock por depósito)
- [ ] Integrar multi-depósito en módulo Ventas (descontar del depósito correcto)

### P2 - Media Prioridad

- [ ] Transferencias de stock entre depósitos
- [ ] Notificaciones de stock bajo
- [ ] Reportes PDF personalizados

### P3 - Baja Prioridad

- [ ] Tema oscuro
- [ ] Aplicación móvil (React Native)
- [ ] Backup automático programado

---

## Notas Técnicas

### Bug Conocido (Workaround aplicado)

El plugin `visual-edits/babel-metadata-plugin.js` puede causar error "Maximum call stack size exceeded". Está desactivado en `craco.config.js`.

### Modelo de Stock

El campo `stock_actual` en productos está siendo reemplazado por `product_stock_collection` que almacena stock por depósito. La migración está en progreso.

---

_Última actualización: Diciembre 2024_
