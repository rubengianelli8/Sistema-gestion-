import { z } from "zod";

export const productCreateSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  codigoBarras: z.string().optional(),
  categoriaId: z.number().int().optional(),
  precioMinorista: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  precioMayorista: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  stockActual: z.number().int().min(0).default(0),
  stockMinimo: z.number().int().min(0).default(0),
  imagenUrl: z.string().url().optional().or(z.literal("")),
});

export const productUpdateSchema = productCreateSchema.partial();

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

