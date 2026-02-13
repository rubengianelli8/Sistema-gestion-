import { z } from "zod";

export const categoryCreateSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
});

export const categoryUpdateSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").optional(),
  descripcion: z.string().optional(),
});

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;

