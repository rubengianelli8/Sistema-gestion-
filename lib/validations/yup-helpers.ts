import "./yup-locale";
import * as yup from "yup";

function isEmptySelectValue(value: unknown) {
  return value === "" || value === null || value === undefined;
}

/** Select opcional que guarda id numérico o null (ej. categoría). */
export function optionalNullableSelectId() {
  return yup
    .number()
    .transform((_value, originalValue) => {
      if (isEmptySelectValue(originalValue)) return null;
      const parsed = Number(originalValue);
      return Number.isNaN(parsed) ? null : parsed;
    })
    .nullable()
    .optional();
}

/** Select obligatorio con id numérico. */
export function requiredSelectId(message: string) {
  return yup
    .number()
    .transform((_value, originalValue) => {
      if (isEmptySelectValue(originalValue)) return undefined;
      const parsed = Number(originalValue);
      return Number.isNaN(parsed) ? undefined : parsed;
    })
    .typeError(message)
    .required(message);
}

/** Select obligatorio de texto (ej. rol). */
export function requiredSelectString(message: string) {
  return yup
    .string()
    .transform((value) => (value === "" ? undefined : value))
    .required(message);
}
