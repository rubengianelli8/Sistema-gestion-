---
name: crud-toasts
description: Al implementar o modificar acciones CRUD de entidades en componentes cliente, siempre notificar al usuario con toasts (sonner) de éxito y error, manteniendo los banners de error en formularios cuando ya existan.
---

## Convención del proyecto

### Toaster global

- `import { Toaster } from "sonner"` debe estar montado una sola vez en [app/layout.tsx](app/layout.tsx) (por ejemplo `<Toaster richColors position="top-right" />`).
- Sin `<Toaster />`, ningún `toast.*` se muestra.

### Formularios (crear / actualizar)

- `import { toast } from "sonner"`.
- Tras llamar a la server action:
  - Si `!result.success`: mantener el banner (`setError` / `setServerError`) **y** `toast.error` con el mismo mensaje (preferir `result.error`).
  - Si éxito: `toast.success` con mensaje en español consistente (ej. "Producto creado exitosamente", "Cliente actualizado exitosamente").
- Envolver en `try/catch` cuando aplique; en el `catch`: `toast.error("Error inesperado")` y, si hay banner, actualizar el estado de error con el mensaje.

### Tablas / eliminación

- En éxito: `toast.success("… eliminado exitosamente")` (o el verbo que corresponda: desactivar, etc.).
- Si `!result.success`: `toast.error(result.error || "…")`.
- En `catch`: `toast.error("Error inesperado")`.

### No sustituir banners

- Si el formulario ya muestra un bloque rojo con el error, **no lo quites**: el toast es **adicional** para feedback visible fuera del formulario.

### Mensajes

- Idioma: español (Argentina) como el resto de la UI.
- Textos cortos y accionables; reutilizar el mismo patrón por entidad.
