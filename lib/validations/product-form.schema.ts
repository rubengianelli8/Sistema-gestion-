import * as yup from "yup";

const supplierPriceSchema = yup.object({
  proveedorId: yup
    .number()
    .typeError("Seleccione un proveedor")
    .required("El proveedor es requerido"),
  precio: yup
    .number()
    .typeError("El precio debe ser un número")
    .min(0, "El precio debe ser mayor o igual a 0")
    .required("El precio es requerido"),
  codigoProveedor: yup.string().optional(),
});

export const productCreateYupSchema = yup.object({
  nombre: yup.string().required("El nombre es requerido"),
  descripcion: yup.string().optional(),
  codigoBarras: yup.string().optional(),
  imagenUrl: yup.string().optional(),
  categoriaId: yup.number().integer().optional().nullable(),
  unitId: yup.number().integer().optional().nullable(),
  stock: yup
    .number()
    .typeError("El stock debe ser un número")
    .integer("El stock debe ser un número entero")
    .min(0, "El stock debe ser mayor o igual a 0")
    .default(0),
  stockMinimo: yup
    .number()
    .typeError("El stock mínimo debe ser un número")
    .integer("El stock mínimo debe ser un número entero")
    .min(0, "El stock mínimo debe ser mayor o igual a 0")
    .default(0),
  supplierPrices: yup.array(supplierPriceSchema).default([]),
});

export const productUpdateYupSchema = productCreateYupSchema;

export type ProductCreateFormValues = yup.InferType<typeof productCreateYupSchema>;
export type ProductUpdateFormValues = yup.InferType<typeof productUpdateYupSchema>;
export type SupplierPriceFormValue = yup.InferType<typeof supplierPriceSchema>;
