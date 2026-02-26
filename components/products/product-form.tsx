"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "@/components/ui/button";
import { RhfInput } from "@/components/ui/rhf-input";
import { createProductAction, updateProductAction } from "@/app/actions/product.actions";
import {
  productCreateYupSchema,
  productUpdateYupSchema,
  type ProductCreateFormValues,
  type ProductUpdateFormValues,
} from "@/lib/validations/product-form.schema";

interface ProductData {
  id: number;
  nombre: string;
  codigoBarras?: string | null;
  precioMinorista: number;
  precioMayorista: number;
}

interface ProductFormProps {
  product?: ProductData | null;
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;

  const [serverError, setServerError] = useState<string | null>(null);

  const methods = useForm<ProductCreateFormValues | ProductUpdateFormValues>({
    resolver: yupResolver(isEdit ? productUpdateYupSchema : productCreateYupSchema) as never,
    defaultValues: {
      nombre: product?.nombre ?? "",
      codigoBarras: product?.codigoBarras ?? "",
      precioMinorista: product?.precioMinorista ?? (undefined as unknown as number),
      precioMayorista: product?.precioMayorista ?? (undefined as unknown as number),
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);

    const payload = {
      nombre: data.nombre,
      codigoBarras: data.codigoBarras || undefined,
      precioMinorista: data.precioMinorista,
      precioMayorista: data.precioMayorista,
      stockActual: 0,
      stockMinimo: 0,
    };

    if (isEdit) {
      const result = await updateProductAction(product.id.toString(), payload);
      if (!result.success) {
        setServerError(result.error || "Error al actualizar el producto");
        return;
      }
    } else {
      const result = await createProductAction(payload);
      if (!result.success) {
        setServerError(result.error || "Error al crear el producto");
        return;
      }
    }

    router.push("/dashboard/productos");
    router.refresh();
  });

  return (
    <div className="max-w-lg">
      <div className="mb-6 flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/productos")}
        >
          ← Volver
        </Button>
        <h1 className="text-2xl font-bold">
          {isEdit ? "Editar Producto" : "Nuevo Producto"}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <FormProvider {...methods}>
          <form onSubmit={onSubmit} className="space-y-4">
            {serverError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {serverError}
              </div>
            )}

            <RhfInput
              name="nombre"
              label="Nombre *"
              placeholder="Nombre del producto"
            />

            <RhfInput
              name="codigoBarras"
              label="Código de Barras"
              placeholder="Código de barras (opcional)"
            />

            <RhfInput
              name="precioMinorista"
              label="Precio Minorista *"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
            />

            <RhfInput
              name="precioMayorista"
              label="Precio Mayorista *"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/productos")}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Guardando..."
                  : isEdit
                  ? "Actualizar Producto"
                  : "Crear Producto"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
