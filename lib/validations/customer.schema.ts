import { z } from "zod";

export const customerCreateSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  dni: z.string().min(1, "El DNI es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono: z.string().min(1, "El teléfono es requerido"),
  direccion: z.string().min(1, "La dirección es requerida"),
});

export const customerUpdateSchema = customerCreateSchema.partial();

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;

