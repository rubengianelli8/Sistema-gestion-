# Contexto obligatorio de negocio en el servidor

Rama de implementación: `feat/contexto-negocio-obligatorio`.

## Validación

`lib/tenant-context.ts` es exclusivo del servidor (`server-only`) y reutiliza el mismo `auth` de NextAuth. No duplica la configuración ni modifica login, callbacks, cookies o proveedores.

- `requireBusinessContext()` obtiene la identidad de la sesión, relee al usuario y verifica existencia, estado activo, coincidencia entre el negocio vigente y el de la sesión, y existencia de la relación Business.
- Devuelve únicamente `userId`, `userName`, `businessId` y el rol vigente, todos obtenidos del registro revalidado en la base. La sesión identifica al usuario y aporta el negocio esperado para contrastarlo; su nombre y rol no se utilizan como valores vigentes. Los permisos existentes se comprueban usando el rol revalidado; no se agregaron roles ni permisos.
- `requireBranchContext()` exige además el identificador de sucursal de la sesión y comprueba en la base su pertenencia al mismo negocio. No elige otra sucursal ni utiliza valores por defecto.
- Una sesión ausente, obsoleta, sin negocio o con una sucursal ajena produce un error genérico. Un SUPERADMIN sin negocio también se rechaza; no existe selección ni suplantación de negocio.
- Los formularios no proporcionan el contexto. Las escrituras seleccionan sus campos y toman los identificadores tenant exclusivamente del contexto validado.

La sucursal de sesión sigue procediendo del comportamiento actual del login: la primera encontrada dentro del negocio. No representa una asignación persistida del empleado. Esa asignación y la selección de sucursal son tareas posteriores.

## Cobertura actual

| Área | Cobertura |
| --- | --- |
| Category | Alta, listado, detalle, comprobación de nombre, actualización y eliminación por negocio. El repository exige contexto también para consultas internas. |
| Client | Alta, listado, detalle interno, búsquedas por DNI/email, actualización y baja lógica por negocio. |
| Product | Alta y todas las consultas y mutaciones del módulo por sucursal validada y `Branch.businessId`. La categoría nueva o conservada en una edición debe pertenecer al negocio. |
| Categoría incluida en Product | Se filtra por negocio incluso si existe una referencia cruzada heredada. No se reparan datos preexistentes. |
| Branch action | Solo devuelve sucursales del negocio revalidado. |
| Supplier actions | Exigen usuario y negocio vigentes, pero mantienen sus consultas globales. **Supplier aún no está aislado por negocio.** |
| SupplierPrice desde productos | El producto se verifica antes de consultar/modificar sus precios. Supplier sigue siendo global; no se garantiza pertenencia tenant del proveedor. |
| Unit | Continúa siendo global y de solo lectura. |

Los registros ajenos de Category, Client y Product se tratan como inexistentes. Las mutaciones incluyen el ámbito también en el `where`, además de las comprobaciones del servicio. La eliminación de una categoría usada se bloquea sin devolver cantidades o datos de otros negocios, incluyendo referencias cruzadas heredadas que podrían activar `ON DELETE SET NULL`.

Las unicidades de nombre de categoría, DNI/email de cliente y barcode siguen siendo globales porque no se modificó el schema. Las comprobaciones de aplicación están limitadas al contexto; un conflicto global de base se devuelve como un error genérico sin identificar otro negocio. Permitir duplicados entre negocios requiere la próxima migración.

## Adaptaciones mínimas en operaciones

- Ventas: búsqueda, barcode y consulta de productos al crear una venta usan contexto de sucursal. La creación transmite esa sucursal y utiliza exclusivamente `context.userId` y `context.userName` para el vendedor y los argumentos de identidad del servicio. Se eliminó el fallback del repository de ventas.
- Presupuestos: la consulta de productos al crear y la identidad del vendedor utilizan el contexto revalidado, incluidos `context.userId` y `context.userName` en los argumentos del servicio.
- Compras: el selector y la consulta de productos al crear se limitan antes de recuperar datos; el servicio recibe el contexto para esa comprobación.

Estas adaptaciones no constituyen aislamiento completo de Sale, Quote o Purchase. Sus listados, detalles, anulaciones, relaciones de clientes/vendedores/proveedores y otros caminos operativos requieren las tareas posteriores correspondientes. Dashboard y CRUD de usuarios también quedan pendientes. No se agregaron claves tenant ni restricciones de base.

`createSaleAction` y `createQuoteAction` invocan únicamente `requireBranchContext()` para obtener identidad y negocio. Cada camino lee la sesión una sola vez, dentro del helper; no mezcla una segunda llamada a `auth()` con el usuario revalidado. Los listados, detalles y la cancelación conservan su alcance anterior.

## Inicialización

El script existente de creación de administrador requiere ahora `INITIAL_BUSINESS_ID` en el entorno del proceso y comprueba que el negocio exista. No crea un negocio ni selecciona el primero. No se ejecutó este script durante la implementación. El flujo de contraseñas y la función existente de creación de SUPERADMIN no se modificaron.

## Verificación sin base de datos

El repositorio ya utiliza verificadores Node con `node:assert`. `scripts/verify-tenant-context.mjs` sigue ese enfoque, con el TypeScript y Zod ya instalados; no agrega un framework ni dependencias.

```text
node scripts/verify-tenant-context.mjs
```

El verificador transpila en memoria los módulos existentes y exige sustitutos explícitos de todas sus dependencias de ejecución. Nunca carga el Prisma real, el proveedor de autenticación ni S3. Comprueba sesiones inválidas, usuario inactivo, cambio de negocio, negocio inexistente, ausencia de negocio para SUPERADMIN, sucursal ajena, uso del rol vigente, registros ajenos, filtros de lectura/mutación y creación sin fallbacks. También comprueba que el navegador no pueda inyectar negocio/rol y que una edición de producto ajeno no llegue a modificar precios de proveedor.

Las regresiones de identidad usan un nombre y rol de sesión desactualizados, comprueban que el contexto devuelve los valores actuales de la base y verifican los datos y argumentos de servicio al crear ventas y presupuestos. Un contador exige exactamente una lectura de sesión por creación. Se revisan además las actions que adoptaron el contexto para detectar lecturas directas de identidad de sesión o llamadas adicionales a `auth()` en esos mismos caminos.

Además deben pasar TypeScript sin emisión, ESLint sobre todos los archivos modificados, Prisma validate y git diff --check. No se necesita iniciar ni modificar MySQL para estos controles. La verificación con MySQL y las restricciones contra referencias cruzadas quedan para la migración posterior.
