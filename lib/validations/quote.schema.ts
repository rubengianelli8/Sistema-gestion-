import { z } from "zod";

export const quoteItemSchema = z.object({
  productoId: z.number().int().positive("El producto es requerido"),
  cantidad: z.number().int().positive("La cantidad debe ser mayor a 0"),
});

export const quoteCreateSchema = z.object({
  clienteId: z.number().int().positive("El cliente es requerido"),
  validezDias: z.number().int().min(1).max(365).default(15),
  notas: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, "Debe agregar al menos un producto"),
});

export type QuoteCreateInput = z.infer<typeof quoteCreateSchema>;
export type QuoteItemInput = z.infer<typeof quoteItemSchema>;

