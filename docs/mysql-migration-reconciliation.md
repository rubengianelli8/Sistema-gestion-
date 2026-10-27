# Reconciliación de migraciones Prisma para MySQL

- Fecha del diagnóstico: 2026-10-26
- Rama: `chore/reconciliar-migraciones-mysql`
- Base local inspeccionada: `corralon` en `localhost:3306`

## Alcance y método

Este documento compara tres fuentes:

1. El estado deseado declarado en `prisma/schema.prisma`.
2. El historial versionado en `prisma/migrations/**`.
3. Los metadatos de la base MySQL local `corralon`.

La inspección de la base se limitó a metadatos obtenidos mediante `information_schema`, `SHOW` y comandos de diagnóstico de Prisma. No se inspeccionaron valores de negocio, no se ejecutaron migraciones y no se creó, alteró ni eliminó ninguna tabla o fila.

El 26/10/2026 el equipo completó el inventario de ambientes conocidos y confirmó que actualmente solo existen bases descartables de desarrollo. No existen bases compartidas, de staging o de producción con información que deba conservarse.

## 1. Estado actual

### 1.1 Proveedor y configuración

- `prisma/schema.prisma` declara `provider = "mysql"`.
- `prisma/migrations/migration_lock.toml` declara `provider = "mysql"`.
- `prisma.config.ts` toma la conexión de `DATABASE_URL`.
- La URL configurada apunta mediante protocolo MySQL a `localhost:3306/corralon`. No se registran credenciales en este documento.
- La aplicación crea `PrismaClient` con `@prisma/adapter-mariadb`; esto es compatible con un servidor MySQL, pero no corrige un historial SQL escrito para otro dialecto.

### 1.2 Versiones relevantes

| Componente | Versión observada |
| --- | ---: |
| Node.js | 22.22.1 |
| Prisma CLI | 7.4.0 |
| `@prisma/client` | 7.4.0 |
| TypeScript usado por Prisma CLI | 5.9.3 |
| MySQL local | 8.0.46 |
| Next.js | 16.1.1 |
| `@prisma/adapter-mariadb` | 7.4.1 declarada |
| paquete `mariadb` | 3.5.1 declarada |

El comando habitual `npx prisma ...` no pudo iniciarse inicialmente porque NVM no tenía una versión activa en el entorno de diagnóstico. Se utilizó directamente la instalación existente de Node 22.22.1 y el Prisma CLI local, sin instalar, actualizar ni activar componentes del sistema.

### 1.3 Migraciones existentes

Hay dos directorios de migración:

1. `20260219232706_update_client_fields`
   - Es una creación completa del esquema.
   - Está escrita con sintaxis PostgreSQL, a pesar de que el lock actual declara MySQL.
2. `20260417120000_add_product_precio`
   - Agrega `Product.precio`.
   - Está escrita con sintaxis MySQL: identificadores con backticks y tipo `DOUBLE`.

El historial es, por lo tanto, una mezcla de dialectos dentro de una carpeta bloqueada como MySQL.

### 1.4 Resultado de Prisma

`prisma validate` finalizó correctamente:

```text
The schema at prisma\schema.prisma is valid
EXIT=0
```

`prisma migrate status` detectó la base MySQL local, encontró dos migraciones y reportó ambas como pendientes:

```text
Datasource "db": MySQL database "corralon" at "localhost:3306"
2 migrations found in prisma/migrations
Following migrations have not yet been applied:
20260219232706_update_client_fields
20260417120000_add_product_precio
EXIT=1
```

La base local no contiene la tabla `_prisma_migrations`. En consecuencia, Prisma no tiene un historial con el cual asociar las tablas ya existentes.

### 1.5 Estructura general encontrada en MySQL

La base local usa:

- Motor InnoDB.
- `utf8mb4` y collation `utf8mb4_unicode_ci`.
- `lower_case_table_names = 1`; por eso `SHOW`/`information_schema` presentan los nombres físicos en minúsculas aunque el schema Prisma use nombres PascalCase.
- Modo estricto, incluyendo `STRICT_TRANS_TABLES`, `NO_ZERO_DATE` y `NO_ZERO_IN_DATE`.

Se encontraron 16 tablas de dominio:

```text
business, branch, user, category, product, client,
sale, saleitem, quote, quoteitem, supplier, supplierprice,
purchase, purchaseitem, tax, unit
```

También se observaron las claves foráneas e índices esperados por el schema actual. `information_schema.TABLES` informó `TABLE_ROWS = 0` para todas las tablas; en InnoDB ese dato es una estimación y no se tomó como prueba definitiva de ausencia de datos. No se ejecutaron consultas sobre los registros de negocio.

La salida de diagnóstico `prisma db pull --print` confirma que la base es introspectable. La estructura resultante coincide ampliamente con el schema actual en columnas, tipos, nullability, defaults, índices y claves foráneas. Las diferencias nominales de modelos y enums en esa salida se deben principalmente a los nombres físicos en minúsculas y al modo en que MySQL representa los enums por columna.

## 2. Inventario de diferencias

### 2.1 Sintaxis PostgreSQL dentro del historial MySQL

La migración `20260219232706_update_client_fields/migration.sql` contiene, entre otros:

- `CREATE TYPE ... AS ENUM`, que no existe en MySQL.
- `SERIAL` para claves autoincrementales.
- Identificadores delimitados con comillas dobles.
- `TEXT` como representación general de strings que Prisma/MySQL materializa normalmente como `VARCHAR(191)`.
- Referencias a enums como tipos independientes, por ejemplo `"UserRole"`.
- Convenciones de constraints y DDL generadas para PostgreSQL.

La migración posterior usa sintaxis MySQL:

```sql
ALTER TABLE `Product` ADD COLUMN `precio` DOUBLE NOT NULL DEFAULT 0;
```

Esto hace imposible reproducir el historial completo en una base MySQL vacía.

### 2.2 Diferencias de enums

| Enum | Migración inicial | Schema actual | Base local |
| --- | --- | --- | --- |
| `UserRole` | `ADMIN`, `VENDEDOR`, `ALMACENERO`, `REPOSITOR`, `CONTADOR` | agrega `SUPERADMIN` | incluye `SUPERADMIN` |
| `SaleStatus` | coincide | coincide | coincide |
| `QuoteStatus` | coincide | coincide | coincide |
| `PaymentMethod` | coincide | coincide | coincide |
| `PurchaseStatus` | coincide | coincide | coincide |

En MySQL los enums no son objetos globales con nombre. La introspección los denomina a partir de tabla y columna (`user_rol`, `sale_estado`, etc.). Esa diferencia de nombres no implica por sí sola una diferencia de valores.

### 2.3 Campos obligatorios y opcionales

La diferencia más relevante es `User.businessId`:

- Migración inicial: `INTEGER NOT NULL`.
- Schema actual: `Int?`.
- Base local: `int NULL`.

Como consecuencia adicional:

- La migración inicial define `User_businessId_fkey` con `ON DELETE RESTRICT`.
- La base local usa `ON DELETE SET NULL`, coherente con la relación opcional del schema actual.

`Product.precio` no está en la migración inicial, pero sí en la segunda migración, el schema y la base local, con `DOUBLE NOT NULL DEFAULT 0`.

Los campos `updatedAt` no muestran una cláusula MySQL `ON UPDATE` en los metadatos. Esto no es necesariamente drift: `@updatedAt` es administrado por Prisma Client y no siempre puede inferirse de la estructura física mediante `db pull`.

### 2.4 Tablas, columnas y relaciones

- La migración inicial intenta crear las mismas 16 tablas principales, pero con DDL PostgreSQL.
- La base local ya contiene esas 16 tablas.
- La base local no contiene `_prisma_migrations`.
- El schema actual y la base local incluyen `Product.precio`; la migración inicial no.
- El schema actual y la base local permiten `User.businessId = NULL`; la migración inicial no.
- Las claves foráneas y sus reglas observadas en MySQL coinciden en general con el schema actual, incluyendo cascadas de items, `SET NULL` para categoría/impuesto/cliente opcionales y `SET NULL` para el negocio opcional de usuario.
- Los nombres físicos aparecen en minúsculas por `lower_case_table_names = 1`. Esto debe considerarse al probar en Linux, donde el comportamiento de casing puede ser distinto.

No se encontró evidencia en metadatos de tablas o columnas locales adicionales respecto de los modelos actuales.

### 2.5 Índices y unicidades

Los índices de la base local coinciden ampliamente con los declarados actualmente. Sin embargo, hay unicidades globales que son incompatibles con el objetivo multicliente futuro:

- `Category.nombre` es globalmente único.
- `Product.codigoBarras` es globalmente único.
- `Client.dni` es globalmente único.
- `Client.email` es globalmente único cuando no es `NULL`.
- `User.email` es globalmente único. Esta puede ser una decisión válida si la identidad es global, pero debe decidirse explícitamente antes del baseline multicliente.
- `SupplierPrice(productoId, proveedorId)` es global por IDs; deberá revisarse cuando proveedor y producto incorporen pertenencia tenant explícita.

`Branch(number, businessId)` ya está correctamente limitada por negocio.

Las futuras decisiones esperables son índices compuestos como `(businessId, nombre)`, `(businessId, codigoBarras)` y `(businessId, dni)`, pero no deben incorporarse al baseline hasta definir reglas de identidad, detectar duplicados y preparar backfills.

### 2.6 Resumen de las tres fuentes

| Área | Schema actual | Migraciones | Base local |
| --- | --- | --- | --- |
| Proveedor | MySQL | lock MySQL, SQL inicial PostgreSQL | MySQL 8.0.46 |
| Tablas de dominio | 16 | intenta crear 16 | 16 existentes |
| Historial Prisma | no aplica | 2 migraciones | `_prisma_migrations` ausente |
| `SUPERADMIN` | presente | ausente en la inicial | presente |
| `User.businessId` | nullable | obligatorio | nullable |
| `Product.precio` | presente | agregado en migración 2 | presente |
| Estructura general | estado deseado actual | no reproducible en MySQL | cercana al schema actual |

La explicación más probable es que la base local se creó o sincronizó por un mecanismo fuera de este historial, posiblemente `prisma db push`. Esto es una inferencia; no se dispone de evidencia suficiente para afirmar qué comando se utilizó.

## 3. Riesgos

### 3.1 Por qué el historial no es reproducible

Una instalación nueva de MySQL intentaría ejecutar primero `CREATE TYPE ... AS ENUM` y fallaría inmediatamente porque MySQL no soporta esa sentencia. La segunda migración nunca podría convertir ese historial en uno válido por sí sola.

Aunque se corrigiera solo el primer error de sintaxis, seguirían existiendo diferencias de tipos, delimitadores, enums, nullability y comportamiento de claves foráneas.

### 3.2 Riesgos de `prisma migrate dev`

- El shadow database no podrá reproducir la migración inicial con MySQL.
- Prisma puede reportar drift entre una base que ya tiene tablas y un historial que figura completamente pendiente.
- Una propuesta de reset destruiría datos si fuera aceptada.
- Editar migraciones históricas después de que algún ambiente las haya registrado produciría diferencias de checksum.
- En MySQL muchas operaciones DDL producen commits implícitos; un fallo en una migración compleja puede dejar cambios parciales.

### 3.3 Riesgos de `prisma migrate deploy`

- En la base local intentaría aplicar migraciones pendientes sobre tablas existentes.
- Con el SQL actual fallaría por sintaxis PostgreSQL.
- Si el SQL se corrigiera sin establecer un baseline, podría fallar con `table already exists`, `column already exists` o constraints duplicadas.
- No detecta ni resuelve automáticamente todos los casos de drift; está pensado para ejecutar un historial ya validado.

### 3.4 Riesgos de `prisma db push`

- Sincroniza el schema sin construir una historia reproducible.
- Puede proponer o ejecutar cambios destructivos, especialmente al cambiar nullability, enums o unicidades.
- Puede ocultar el problema a corto plazo mientras deja `_prisma_migrations` ausente.
- Un cambio de índices globales a compuestos requiere analizar duplicados y semántica; no debe delegarse ciegamente a `db push`.

### 3.5 Riesgos según el tipo de ambiente

**Base existente:**

- Marcar una migración como aplicada cuando la estructura no coincide exactamente puede institucionalizar drift.
- Agregar columnas obligatorias sin backfill puede fallar o introducir valores incorrectos.
- Cambiar enums o unicidades puede bloquear datos existentes.
- Reescribir migraciones aplicadas en otro ambiente rompe checksums y trazabilidad.

**Instalación nueva:**

- Actualmente no puede construirse desde cero con `migrate deploy`.
- Una base creada con `db push` podría funcionar, pero no probaría que el historial es desplegable.

**Producción o ambientes compartidos:**

El inventario de ambientes conocidos fue completado por el equipo el 26/10/2026. Actualmente no existen bases compartidas, de staging o de producción. Por lo tanto, no hay datos productivos que requieran migración o backfill. Si en el futuro aparece un ambiente no inventariado, deberá evaluarse antes de modificar el historial de migraciones.

## 4. Estrategias posibles

### 4.1 Baseline MySQL nuevo

Consiste en definir un punto de partida canónico, generado para MySQL desde el schema aprobado, y tratar las tablas existentes equivalentes como preexistentes al baseline.

**Ventajas:**

- Produce una instalación nueva reproducible.
- Elimina la mezcla de dialectos del historial activo.
- Permite revisar un único SQL inicial coherente.
- Crea una base clara para los cambios multicliente posteriores.

**Desventajas y riesgos:**

- Requiere decidir cómo conservar el historial anterior en Git/documentación sin dejarlo en la cadena activa.
- Las bases existentes deben compararse exactamente antes de marcar el baseline como aplicado.
- `prisma migrate resolve --applied` modifica `_prisma_migrations` y requiere aprobación, backup y evidencia de equivalencia.
- Si algún ambiente ya registró las migraciones actuales, no se puede sustituir el historial de manera uniforme sin un plan específico.

### 4.2 Migraciones correctivas sobre el historial actual

Consiste en conservar la secuencia y corregir la migración inicial o agregar cambios posteriores.

**Ventajas:**

- Preserva nombres y orden histórico si existen ambientes que ya dependen de ellos.
- Puede minimizar cambios organizativos en repositorios con despliegues establecidos.

**Desventajas y riesgos:**

- Una migración posterior no puede reparar el hecho de que la primera ni siquiera se ejecuta en MySQL.
- Corregir una migración histórica cambia su checksum si ya fue aplicada en algún ambiente.
- La base local seguiría necesitando un baseline o `resolve`, porque tiene tablas pero no historial.
- Tiende a producir una cadena más difícil de auditar y probar.

Esta alternativa solo es razonable si se descubre que un ambiente relevante ya registra el historial actual y existe evidencia precisa de cómo fue aplicado. Aun en ese caso probablemente se necesiten rutas de reconciliación distintas para bases nuevas y existentes.

## 5. Estrategia elegida

El equipo confirmó como estrategia elegida **crear un baseline MySQL nuevo y canónico**, antes de implementar cambios multicliente.

La justificación es:

1. La primera migración es estructuralmente incompatible con MySQL.
2. La base local no registra ninguna migración aplicada.
3. La base local coincide mucho más con el schema actual que con el SQL inicial.
4. Una migración correctiva posterior no puede convertir una cadena cuyo primer paso falla en una instalación reproducible.
5. Un baseline limpio permite validar primero el estado actual y después agregar cambios multicliente en migraciones pequeñas y revisables.

### Supuestos y condiciones

- Se asume únicamente que `prisma/schema.prisma` representa la intención actual del código; esto deberá ser confirmado por el equipo.
- No se asume que la base local esté vacía. `TABLE_ROWS = 0` es solo metadata estimada.
- El inventario de ambientes conocidos está completo al 26/10/2026.
- Solo existen bases descartables de desarrollo.
- No existen datos productivos que requieran migración, conservación o backfill.
- No se identificaron ambientes compartidos con migraciones aplicadas que obliguen a conservar el historial actual como cadena activa.
- El baseline no debería incluir todavía cambios multicliente no implementados. Primero debe representar fielmente un estado actual aprobado; luego los cambios de tenancy deben entrar como migraciones posteriores.

La elección de estrategia no autoriza todavía su implementación. Las migraciones actuales deben permanecer intactas hasta que se apruebe y ejecute una tarea posterior específica. El baseline deberá generarse y probarse primero en una base MySQL descartable. Si en el futuro se descubre un ambiente no inventariado con migraciones registradas, la estrategia deberá reevaluarse para ese ambiente.

## Decisiones confirmadas del equipo

1. El inventario de ambientes conocidos ya fue realizado.
2. Actualmente solo existen bases descartables de desarrollo.
3. No existen bases compartidas, de staging o de producción.
4. No hay datos productivos que deban conservarse, migrarse o backfillearse.
5. La estrategia elegida es crear un baseline MySQL nuevo y canónico.
6. Toda generación y aplicación futura del baseline se probará primero en una base MySQL descartable.
7. El baseline no se implementa como parte de este documento y las migraciones actuales permanecen sin cambios.

## Decisiones pendientes del equipo

1. Confirmar si `prisma/schema.prisma` está aprobado como estado de referencia.
2. Decidir si el email de usuario será global o podrá repetirse entre negocios.
3. Definir qué sistema operativo y configuración de casing tendrá el futuro servidor.

## 6. Plan de implementación posterior

### Paso 1: congelar y aprobar el estado de referencia

- Confirmar que el schema actual es el estado funcional que se quiere preservar.
- Mantener registrado el inventario ya completado: solo existen bases descartables de desarrollo.
- Registrar versión del servidor, casing, charset, collation y versión de Prisma de cada una.

### Paso 2: realizar respaldos verificables

- No se requiere migración, backfill ni respaldo de datos productivos porque no existen ambientes productivos o compartidos con información que conservar.
- Si se decide conservar datos de alguna base descartable de desarrollo, generar un backup lógico antes de cualquier DDL o modificación de `_prisma_migrations`.
- Incluir estructura, datos, triggers, routines y la tabla `_prisma_migrations` si existe.
- Verificar restauración en un servidor descartable; un archivo de backup no probado no constituye rollback suficiente.

### Paso 3: inventariar cada base existente

- Considerar completado el inventario general de ambientes conocidos al 26/10/2026.
- Repetir sobre la base descartable elegida la consulta de tablas, columnas, nullability, defaults, índices, claves foráneas y enums.
- Consultar historial y checksums de `_prisma_migrations` cuando exista.
- No se requiere analizar datos productivos ni preparar backfills para el baseline actual.

### Paso 4: generar el baseline MySQL

- Generar SQL desde un schema aprobado usando una versión fijada de Prisma.
- Revisar manualmente tipos, longitudes, nombres, reglas `ON DELETE`, índices y charset/collation.
- Decidir explícitamente la política de nombres y casing para Windows y Linux.
- Conservar el historial anterior mediante Git y documentación, aunque deje de formar parte de la cadena activa, si esa decisión es aprobada.

### Paso 5: probar en una base MySQL descartable

- Crear una instancia con versión y configuración equivalentes al destino.
- Ejecutar el historial nuevo desde cero.
- Ejecutar `prisma validate`, `prisma migrate status` y una comparación schema/base.
- Repetir la prueba desde cero automáticamente para demostrar reproducibilidad.

### Paso 6: ensayar una base existente restaurada

- Este paso no es necesario bajo el inventario actual porque no existen bases compartidas o productivas que deban conservarse.
- Mantenerlo como contingencia: si aparece un ambiente no inventariado, restaurar una copia en una base descartable.
- Comparar su estructura con el baseline.
- Preparar cambios correctivos mínimos, backfills y validaciones previas.
- Solo si la equivalencia está demostrada, ensayar el marcado del baseline como aplicado.

### Paso 7: conservar y backfillear datos

- No se requiere backfill de datos productivos para crear el baseline bajo las condiciones confirmadas.
- Reservar este procedimiento para futuros cambios multicliente o para un ambiente no inventariado que aparezca posteriormente.
- Agregar primero campos tenant como opcionales cuando sea necesario.
- Poblarlos con reglas de negocio verificables.
- Validar que no queden nulos, huérfanos ni referencias cruzadas.
- Recién después agregar `NOT NULL`, claves foráneas o unicidades compuestas.
- Separar baseline, backfill y constraints multicliente en migraciones/PR distintos.

### Paso 8: ejecutar controles de aceptación

- Construcción desde una base vacía.
- Ensayo sobre restauración de una base existente.
- `prisma migrate status` consistente.
- Comparación automatizada sin drift inesperado.
- Pruebas funcionales y de integridad sobre los módulos críticos.

### Paso 9: plan de rollback

- Detener escrituras durante la ventana si el cambio lo requiere.
- Conservar backup verificado inmediatamente anterior.
- Documentar cómo restaurar tanto datos como historial Prisma.
- Revertir archivos de migración mediante Git, no editando manualmente una migración ya desplegada.
- Definir un punto de no retorno para cada DDL y criterios concretos para abortar.

### Acciones que requieren aprobación previa

- Editar, retirar, mover o reemplazar migraciones existentes.
- Crear el baseline nuevo.
- Crear o eliminar bases descartables.
- Ejecutar `migrate dev`, `migrate deploy`, `db push` o SQL DDL.
- Ejecutar `prisma migrate resolve` sobre cualquier base.
- Crear backups fuera del workspace o acceder a ambientes remotos.
- Consultar o modificar datos de negocio para backfills.
- Aplicar cambios de nullability, enums, claves foráneas o índices únicos.
- Cualquier operación sobre staging o producción.

## 7. Criterios de finalización del futuro baseline

El baseline se considerará terminado únicamente cuando se cumplan todos estos puntos:

1. Una base MySQL vacía puede construirse desde cero usando solo el historial versionado.
2. `prisma migrate status` finaliza consistentemente sin migraciones pendientes ni fallidas.
3. `prisma validate` finaliza correctamente.
4. El schema Prisma y la estructura resultante coinciden sin drift inesperado.
5. Las tablas, índices, enums, defaults, nullability y reglas referenciales fueron revisados.
6. Una restauración de cada base existente puede reconciliarse sin pérdida de datos.
7. Los backfills tienen validaciones previas y posteriores.
8. Existe un rollback ensayado y documentado.
9. El procedimiento fija versiones relevantes de MySQL, Node y Prisma.
10. CI crea una base MySQL descartable, aplica todas las migraciones desde cero y verifica automáticamente el resultado.
11. Los resultados son reproducibles en un entorno con el mismo comportamiento de casing que producción.
12. Los cambios multicliente posteriores se implementan como migraciones nuevas y revisables, no se mezclan silenciosamente dentro del baseline aprobado.

## Conclusión

El schema actual es válido y la base local está estructuralmente cerca de él, pero el historial de migraciones no describe cómo reconstruir esa base en MySQL. La ausencia de `_prisma_migrations`, combinada con una migración inicial PostgreSQL y una segunda migración MySQL, obliga a tratar la situación como una reconciliación de baseline, no como una simple migración correctiva.

El inventario de ambientes ya está completo y no hay datos productivos que conservar. La estrategia elegida es un baseline MySQL nuevo, pero todavía no debe implementarse. La siguiente acción segura es resolver las decisiones pendientes, aprobar el estado de referencia y, en una tarea posterior autorizada, generar y ensayar el baseline exclusivamente sobre una base MySQL descartable antes de adoptarlo.
