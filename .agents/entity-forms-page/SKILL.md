---
name: entity-forms-page
description: Los formularios de alta/edición de entidades en el dashboard deben vivir en páginas dedicadas (/new y /[id]), nunca en diálogos (Dialog). Aplicar al crear o refactorizar CRUDs.
---

## Convención del proyecto

### Rutas

- Alta: `app/dashboard/{entidad}/new/page.tsx` (Server Component) con `requirePermission({ENTIDAD}_CREAR)`.
- Edición: `app/dashboard/{entidad}/[id]/page.tsx` (Server Component) con `requirePermission({ENTIDAD}_EDITAR)` que obtiene la entidad (p. ej. `getByIdAction(id)`) y usa `notFound()` si no existe.
- Ambas cargan datos relacionados con `Promise.all([...])` cuando aplique y pasan props al formulario cliente.

### Componente form

- `components/{entidades}/{entidad}-form.tsx` es un Client Component **sin** `Dialog`.
- Props: `entity?: EntityData | null` (alta si es `null`/omitido, edición si viene con `id`) más datos relacionados si los hay.
- Usa `useRouter`; en éxito `router.push("/dashboard/{entidad}")` (lista).
- Contenedor típico: `<div className="p-6 max-w-3xl mx-auto">` con `<h1>` "Nueva {Entidad}" / "Editar {Entidad}" y botón "Volver" que hace `router.push("/dashboard/{entidad}")`.
- Feedback: toasts y banner de error en formulario según el skill [crud-toasts](../crud-toasts/SKILL.md).

### Tabla

- `components/{entidades}/{entidades}-table.tsx` **no** abre diálogos para crear/editar:
  - Botón agregar: `router.push("/dashboard/{entidad}/new")`.
  - Editar fila: `router.push("/dashboard/{entidad}/" + id)`.
  - Eliminar: `ConfirmDialog` + server action + `router.refresh()` (ver skill [app-confirm-dialog](../app-confirm-dialog/SKILL.md)).

### Referencia en el repo

- Productos: [app/dashboard/productos/new/page.tsx](../../app/dashboard/productos/new/page.tsx), [app/dashboard/productos/[id]/page.tsx](../../app/dashboard/productos/[id]/page.tsx), [components/products/product-form.tsx](../../components/products/product-form.tsx).
- Proveedores (mismo patrón): `app/dashboard/proveedores/new/page.tsx`, `app/dashboard/proveedores/[id]/page.tsx`, `components/suppliers/supplier-form.tsx`.

### No hacer

- NO usar [components/ui/dialog.tsx](../../components/ui/dialog.tsx) para formularios de alta/edición de entidades.
- NO abrir modales para crear o editar entidades; siempre navegar a una ruta.
- Las confirmaciones puntuales (p. ej. eliminar) deben usar `ConfirmDialog` (ver [app-confirm-dialog](../app-confirm-dialog/SKILL.md)).
