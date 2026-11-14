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
| Supplier actions | CRUD, comprobación de CUIT y consultas de precios limitados al BusinessContext. Supplier tiene businessId obligatorio. |
| SupplierPrice desde productos | Producto y proveedores se validan antes de escribir; los precios se filtran por negocio y las FK compuestas impiden relaciones cruzadas. Compras guarda el mismo businessId desde el contexto. |
| Unit | Continúa siendo global y de solo lectura. |

Los registros ajenos de Category, Client y Product se tratan como inexistentes. Las mutaciones incluyen el ámbito también en el `where`, además de las comprobaciones del servicio. La eliminación de una categoría usada se bloquea sin devolver cantidades o datos de otros negocios, y la nueva FK compuesta de categoría utiliza `ON DELETE RESTRICT`.

La migración posterior de claves tenant convierte nombre de categoría y DNI/email de cliente en únicos por negocio. El barcode es único por negocio y sucursal; el CUIT de proveedor es único por negocio cuando está informado. Los vacíos de barcode, CUIT y email de proveedor se normalizan a NULL en el servidor. User.email conserva su unicidad global. Ver `docs/tenant-keys-catalogs.md`.

## Adaptaciones mínimas en operaciones

- Ventas: búsqueda, barcode y consulta de productos al crear una venta usan contexto de sucursal. La creación transmite esa sucursal y utiliza exclusivamente `context.userId` y `context.userName` para el vendedor y los argumentos de identidad del servicio. Se eliminó el fallback del repository de ventas.
- Presupuestos: la consulta de productos al crear y la identidad del vendedor utilizan el contexto revalidado, incluidos `context.userId` y `context.userName` en los argumentos del servicio.
- Compras: el selector y la consulta de productos al crear se limitan antes de recuperar datos; el servicio recibe el contexto para esa comprobación.

Estas adaptaciones no constituyen aislamiento completo de Sale, Quote o Purchase. Sus listados, detalles, anulaciones y otras relaciones operativas requieren las tareas posteriores correspondientes. La creación de compras valida proveedor y productos y escribe precios del mismo negocio. Dashboard y CRUD de usuarios también quedan pendientes. Las nuevas restricciones cubren catálogos y terceros, no el aislamiento completo de operaciones.

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

Además deben pasar TypeScript sin emisión, ESLint sobre todos los archivos modificados, Prisma validate y git diff --check. No se necesita iniciar ni modificar MySQL para estos controles. La migración de claves tenant incorpora además la verificación real de restricciones y unicidades en MySQL mediante `node scripts/verify-mysql-tenant-keys.mjs`, exclusivamente en corralon_tenant_keys_test.
