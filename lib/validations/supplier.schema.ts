import { z } from "zod";

export const supplierCreateSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  contacto: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  cuit: z.string().optional(),
});

export const supplierUpdateSchema = supplierCreateSchema.partial();

export type SupplierCreateInput = z.infer<typeof supplierCreateSchema>;
export type SupplierUpdateInput = z.infer<typeof supplierUpdateSchema>;
