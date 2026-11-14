# Claves tenant en catálogos y terceros

Implementación del 12/11/2026 en `feat/claves-tenant-catalogos-terceros`, sobre el contexto de negocio integrado en `71f6642`.

## Modelo final

Product, Supplier y SupplierPrice tienen businessId obligatorio y una relación directa con Business. Los identificadores se toman exclusivamente de requireBusinessContext()/requireBranchContext(); no se aceptan del navegador.

| Modelo | Clave de unicidad funcional | Relaciones tenant |
| --- | --- | --- |
| Branch | number + businessId, conservada | id + businessId permite la referencia compuesta desde Product |
| Category | businessId + nombre | id + businessId permite la categoría opcional de Product |
| Client | businessId + dni; businessId + email | Business existente; email sigue nullable |
| Product | businessId + branchId + codigoBarras | Business directo, Branch(branchId,businessId), Category(categoriaId,businessId); id + businessId para precios |
| Supplier | businessId + cuit | Business directo; id + businessId para precios |
| SupplierPrice | businessId + productoId + proveedorId | Business directo y FK compuestas hacia Product y Supplier |
| User | email global, conservada | Sin cambios en esta tarea |
| Unit | Sin cambios | Global, fija y de solo lectura; Product.unitId sigue siendo opcional |

Las FK compuestas impiden que Product use una sucursal o categoría de otro negocio, o que SupplierPrice mezcle un producto y un proveedor de negocios diferentes. Category usa ON DELETE RESTRICT: no se intenta poner businessId en NULL. Los precios conservan borrado en cascada al eliminar el producto/proveedor. No se cambia la política global de Business.

Se conservaron los índices simples existentes de búsqueda y las claves primarias. Solo se sustituyeron los índices únicos globales incompatibles con la regla aprobada; se agregaron las claves candidatas y los índices necesarios para las nuevas FK. Los índices auxiliares que MySQL requiere para las FK pueden ser implícitos. La comprobación final de drift incluye esos índices.

## Normalización y escrituras

`lib/catalog-values.ts` convierte barcode, CUIT y email de proveedor vacíos o compuestos solo por espacios a NULL. Al editar, undefined significa conservar el campo; una cadena vacía significa limpiarlo. El CUIT elimina espacios, puntos y guiones de presentación antes de comprobar y almacenar su unicidad. No se introduce una nueva validación fiscal del número.

El mismo barcode puede existir en dos sucursales del negocio y en negocios diferentes; no puede repetirse dentro de la misma sucursal. MySQL permite múltiples NULL en estos índices compuestos. Se mantiene utf8mb4_unicode_ci, incluyendo su comparación sin distinción de mayúsculas/acentos. No se redefine el casing físico de tablas: Prisma conserva PascalCase; el MySQL local con lower_case_table_names=1 presenta nombres en minúsculas.

Supplier actions/service/repository exigen BusinessContext en altas, listados, detalles, edición, baja lógica, comprobación de CUIT y consultas de precios. Todas esas consultas conservan el filtro incluso al incluir registros inactivos. Los proveedores ajenos se tratan como inexistentes.

Alta y edición de productos validan todos los proveedores antes de modificar el producto. Los upserts y eliminaciones de precios usan el negocio del contexto. La creación de compras valida proveedor y productos por negocio/sucursal antes de iniciar las escrituras y utiliza la nueva clave compuesta al actualizar precios. Las FK son una segunda barrera independiente de las validaciones de aplicación.

## Estrategia de migración

El baseline `20261029000000_mysql_baseline/migration.sql` permanece intacto. La nueva migración es `20261112000000_add_tenant_keys_catalogs/migration.sql`; sus cambios estructurales se generaron con Prisma CLI local 7.4.0 comparando el snapshot anterior y el schema nuevo. Se añadió únicamente una protección SQL previa.

Solo existen bases descartables, sin datos reales ni ambientes persistentes. Por eso no se hace backfill: Product, Supplier y SupplierPrice deben estar vacíos al aplicar la migración. Si alguna contiene filas, una tabla temporal de guarda provoca una violación de clave primaria y aborta antes del primer ALTER/DROP de esquema. El marcador de la tabla temporal no representa un identificador tenant. No se usa un valor por defecto para businessId ni se elige un negocio arbitrario.

Una base descartable poblada debe reconstruirse mediante una tarea expresamente autorizada para esa base. Esta implementación no reconstruye ni conecta a corralon. Si el despliegue del guard falla en una base poblada, no se debe resolver el historial como aplicado: hay que reconstruir la base descartable o diseñar un backfill separado y verificable. MySQL no garantiza rollback global del DDL.

## Verificación reproducible

Proporcionar DATABASE_URL exclusivamente al proceso, con destino local exacto `corralon_tenant_keys_test`, sin imprimir credenciales. Los verificadores no cargan .env ni admiten otro nombre de base, opciones adicionales de URL o un servidor remoto. Si la base ya existe, se detienen sin alterarla ni eliminarla.

```text
node node_modules/prisma/build/index.js validate
node node_modules/prisma/build/index.js generate
node scripts/verify-tenant-context.mjs
node scripts/verify-mysql-tenant-keys.mjs
npx --no-install tsc --noEmit --incremental false
git diff --check
```

`scripts/verify-mysql-baseline.cjs` mantiene un único ciclo de vida para esa base. Primero ejecuta únicamente el baseline desde una copia temporal de sus archivos y comprueba migrate status, equivalencia contra `scripts/fixtures/mysql-baseline.prisma`, metadatos e historial/checksum. El snapshot es el schema anterior congelado; no se usa para generar el cliente actual ni se cambia junto con nuevas migraciones. Después ejecuta la cadena completa y exige nuevamente migrate status y migrate diff --exit-code sin diferencias contra el schema vigente. El conteo de FK del baseline se comprueba en la fase original, no se confunde con el estado final.

El verificador de claves reutiliza ese ciclo. Antes de actualizar, inserta un proveedor legado ambiguo, demuestra que la guarda aborta y retira exclusivamente esa fila de prueba. Después crea negocios/sucursales con los IDs devueltos y comprueba unicidades entre/dentro de negocios, múltiples NULL, barcode por sucursal, rechazos de FK cruzadas, obligatoriedad de businessId, Category restrictiva y email global de User. No modifica Unit.

La base se elimina en finally solamente si fue creada por esa ejecución, y se comprueba su ausencia. También se elimina el proyecto temporal creado por el verificador. En local las credenciales existentes se leen en memoria y se cambia el nombre de base antes de iniciar el hijo; el proceso padre y .env permanecen intactos.

GitHub Actions utiliza MySQL 8.0.46 efímero, Node 22.22.1 y versiones del lockfile, con credenciales de prueba públicas propias del contenedor y sin secretos del repositorio. Ejecuta generate, el verificador tenant y la comprobación real de baseline + cadena completa + claves. Su ejecución remota ocurre con el próximo push/PR; no se hace push en esta tarea.

Verificación local del 12/11/2026: baseline aislado con 16 tablas y 24 FK; cadena completa con 16 tablas y 27 FK, migrate status correcto y migrate diff --exit-code = 0. Pasaron las 31 comprobaciones SQL, incluida la guarda ante datos legados. La base descartable fue eliminada y se confirmó su ausencia.

## Alcance pendiente

No se implementa el aislamiento completo de Sale, Quote, Purchase, dashboard o usuarios, ni roles nuevos, permisos individuales, cajas, asignación persistente de sucursal o selección de negocio. Las relaciones operativas por ID que quedan fuera de esta tarea requieren sus validaciones y migraciones posteriores. Las nuevas FK aseguran las relaciones de catálogos y precios descritas arriba; no convierten por sí solas el sistema completo en multicliente.
