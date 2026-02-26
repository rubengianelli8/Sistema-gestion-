import * as yup from "yup";

export const productCreateYupSchema = yup.object({
  nombre: yup.string().required("El nombre es requerido"),
  codigoBarras: yup.string().optional(),
  precioMinorista: yup
    .number()
    .typeError("El precio minorista debe ser un número")
    .min(0, "El precio debe ser mayor o igual a 0")
    .required("El precio minorista es requerido"),
  precioMayorista: yup
    .number()
    .typeError("El precio mayorista debe ser un número")
    .min(0, "El precio debe ser mayor o igual a 0")
    .required("El precio mayorista es requerido"),
});

export const productUpdateYupSchema = productCreateYupSchema;

export type ProductCreateFormValues = yup.InferType<typeof productCreateYupSchema>;
export type ProductUpdateFormValues = yup.InferType<typeof productUpdateYupSchema>;
