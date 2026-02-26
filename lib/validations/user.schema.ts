import { z } from "zod";
import { UserRole } from "@prisma/client";

export const userCreateSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().min(1, "El nombre es requerido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  rol: z.nativeEnum(UserRole),
  businessId: z.number().optional(),
});

export const userUpdateSchema = z.object({
  email: z.string().email("Email inválido").optional(),
  name: z.string().min(1, "El nombre es requerido").optional(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional().or(z.literal("")),
  rol: z.nativeEnum(UserRole).optional(),
  estado: z.boolean().optional(),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
