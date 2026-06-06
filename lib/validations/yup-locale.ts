import { setLocale } from "yup";

setLocale({
  mixed: {
    default: "Valor inválido",
    required: "Este campo es obligatorio",
    notType: "Seleccioná una opción válida",
  },
  string: {
    email: "Ingresá un email válido",
  },
  number: {
    min: ({ min }) => `Debe ser mayor o igual a ${min}`,
    integer: "Debe ser un número entero",
  },
});
