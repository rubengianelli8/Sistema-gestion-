import * as yup from "yup";
import { requiredSelectString } from "@/lib/validations/yup-helpers";

export const userCreateYupSchema = yup.object({
  name: yup.string().required("El nombre es obligatorio"),
  email: yup
    .string()
    .email("Ingresá un email válido")
    .required("El email es obligatorio"),
  password: yup
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .required("La contraseña es obligatoria"),
  rol: requiredSelectString("Seleccioná un rol"),
  branchId: yup.string().optional(),
});

export const userUpdateYupSchema = yup.object({
  name: yup.string().required("El nombre es obligatorio"),
  email: yup
    .string()
    .email("Ingresá un email válido")
    .required("El email es obligatorio"),
  password: yup
    .string()
    .transform((value) => (value === "" ? undefined : value))
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .optional(),
  rol: requiredSelectString("Seleccioná un rol"),
  branchId: yup.string().optional(),
});

export type UserCreateFormValues = yup.InferType<typeof userCreateYupSchema>;
export type UserUpdateFormValues = yup.InferType<typeof userUpdateYupSchema>;
