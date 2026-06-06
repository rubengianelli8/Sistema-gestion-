import * as yup from "yup";
import {
  optionalNullableSelectId,
  requiredSelectId,
} from "@/lib/validations/yup-helpers";

const supplierPriceSchema = yup.object({
  proveedorId: requiredSelectId("Seleccioná un proveedor"),
  precio: yup
    .number()
    .transform((_value, originalValue) => {
      if (originalValue === "" || originalValue === null || originalValue === undefined) {
        return undefined;
      }
      const parsed = Number(originalValue);
      return Number.isNaN(parsed) ? undefined : parsed;
    })
    .typeError("Ingresá un precio válido")
    .min(0, "El precio debe ser mayor o igual a 0")
    .required("El precio es obligatorio"),
  codigoProveedor: yup.string().optional(),
});

export const productCreateYupSchema = yup.object({
  nombre: yup.string().required("El nombre es obligatorio"),
  descripcion: yup.string().optional(),
  codigoBarras: yup.string().optional(),
  imagenUrl: yup.string().optional(),
  categoriaId: optionalNullableSelectId(),
  unitId: optionalNullableSelectId(),
  stock: yup
    .number()
    .transform((_value, originalValue) => {
      if (originalValue === "" || originalValue === null || originalValue === undefined) {
        return 0;
      }
      const parsed = Number(originalValue);
      return Number.isNaN(parsed) ? 0 : parsed;
    })
    .typeError("Ingresá un stock válido")
    .integer("El stock debe ser un número entero")
    .min(0, "El stock debe ser mayor o igual a 0")
    .default(0),
  stockMinimo: yup
    .number()
    .transform((_value, originalValue) => {
      if (originalValue === "" || originalValue === null || originalValue === undefined) {
        return 0;
      }
      const parsed = Number(originalValue);
      return Number.isNaN(parsed) ? 0 : parsed;
    })
    .typeError("Ingresá un stock mínimo válido")
    .integer("El stock mínimo debe ser un número entero")
    .min(0, "El stock mínimo debe ser mayor o igual a 0")
    .default(0),
  precio: yup
    .number()
    .transform((_value, originalValue) => {
      if (originalValue === "" || originalValue === null || originalValue === undefined) {
        return undefined;
      }
      const parsed = Number(originalValue);
      return Number.isNaN(parsed) ? undefined : parsed;
    })
    .typeError("Ingresá un precio válido")
    .min(0, "El precio debe ser mayor o igual a 0")
    .required("El precio es obligatorio")
    .default(0),
  supplierPrices: yup.array(supplierPriceSchema).default([]),
});

export const productUpdateYupSchema = productCreateYupSchema;

export type ProductCreateFormValues = yup.InferType<typeof productCreateYupSchema>;
export type ProductUpdateFormValues = yup.InferType<typeof productUpdateYupSchema>;
export type SupplierPriceFormValue = yup.InferType<typeof supplierPriceSchema>;
