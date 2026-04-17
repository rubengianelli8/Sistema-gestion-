import { z } from "zod";

export const purchaseItemSchema = z.object({
  productoId: z.number().int().positive(),
  cantidad: z.number().int().positive(),
  precioUnitario: z.number().nonnegative(),
});

export const purchaseCreateSchema = z.object({
  proveedorId: z.number().int().positive(),
  numeroFactura: z.string().optional(),
  notas: z.string().optional(),
  items: z
    .array(purchaseItemSchema)
    .min(1, "Debe agregar al menos un producto"),
});

export type PurchaseCreateInput = z.infer<typeof purchaseCreateSchema>;
