import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

export const saleItemSchema = z.object({
  productoId: z.number().int().positive("El producto es requerido"),
  cantidad: z.number().int().positive("La cantidad debe ser mayor a 0"),
});

export const saleCreateSchema = z.object({
  clienteId: z.number().int().positive().optional(),
  metodoPago: z.nativeEnum(PaymentMethod),
  notas: z.string().optional(),
  items: z.array(saleItemSchema).min(1, "Debe agregar al menos un producto"),
});

export type SaleCreateInput = z.infer<typeof saleCreateSchema>;
export type SaleItemInput = z.infer<typeof saleItemSchema>;

