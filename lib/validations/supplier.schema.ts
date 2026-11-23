import { z } from "zod";

export const supplierCreateSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  contacto: z.string().optional(),
  email: z.string().trim().pipe(z.string().email("Email inválido").or(z.literal(""))).optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  cuit: z.string().trim().optional(),
});

export const supplierUpdateSchema = supplierCreateSchema.partial();

export type SupplierCreateInput = z.infer<typeof supplierCreateSchema>;
export type SupplierUpdateInput = z.infer<typeof supplierUpdateSchema>;
