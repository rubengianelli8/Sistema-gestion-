import { z } from "zod";

export const customerCreateSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  dni: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  limiteCredito: z.number().min(0, "El límite de crédito debe ser mayor o igual a 0").default(0),
});

export const customerUpdateSchema = customerCreateSchema.partial();

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;

