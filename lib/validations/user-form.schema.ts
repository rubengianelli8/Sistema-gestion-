import * as yup from "yup";

export const userCreateYupSchema = yup.object({
  name: yup.string().required("El nombre es requerido"),
  email: yup
    .string()
    .email("Email inválido")
    .required("El email es requerido"),
  password: yup
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .required("La contraseña es requerida"),
  rol: yup.string().required("El rol es requerido"),
  branchId: yup.string().optional(),
});

export const userUpdateYupSchema = yup.object({
  name: yup.string().required("El nombre es requerido"),
  email: yup
    .string()
    .email("Email inválido")
    .required("El email es requerido"),
  password: yup
    .string()
    .transform((value) => (value === "" ? undefined : value))
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .optional(),
  rol: yup.string().required("El rol es requerido"),
  branchId: yup.string().optional(),
});

export type UserCreateFormValues = yup.InferType<typeof userCreateYupSchema>;
export type UserUpdateFormValues = yup.InferType<typeof userUpdateYupSchema>;
