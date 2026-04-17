---
name: app-confirm-dialog
description: Para cualquier confirmación de acción destructiva o irreversible (eliminar, anular, desactivar, etc.) usar SIEMPRE el ConfirmDialog de la app. NUNCA usar `window.confirm`, `alert` o `prompt` nativos del navegador.
---

## Convención del proyecto

### Qué usar

- `import { ConfirmDialog } from "@/components/ui/confirm-dialog";` para TODA confirmación destructiva.
- Props típicas: `open`, `onOpenChange`, `title`, `description`, `confirmLabel`, `variant="destructive"`, `loading`, `onConfirm`.
- Ver ejemplo ya en uso en [components/products/products-table.tsx](../../components/products/products-table.tsx).

### Patrón

- Estado local:
  - `const [confirmOpen, setConfirmOpen] = useState(false);`
  - `const [pendingId, setPendingId] = useState<number | null>(null);`
  - `const [deleting, setDeleting] = useState(false);`
- `onClick` del botón Eliminar: `setPendingId(id); setConfirmOpen(true);`
- `onConfirm`: ejecuta la server action, toasts de éxito/error (ver skill `crud-toasts`), cierra el diálogo en finally.

### Qué NO usar

- NO `confirm(...)`, `alert(...)`, `prompt(...)` del navegador.
- NO `window.confirm` / `window.alert`.
- NO confirmaciones inline (solo un botón destructivo sin paso de confirmación) para acciones irreversibles.
