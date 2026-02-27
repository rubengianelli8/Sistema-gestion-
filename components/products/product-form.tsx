"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "@/components/ui/button";
import { RhfInput } from "@/components/ui/rhf-input";
import { RhfSelect } from "@/components/ui/rhf-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createProductAction, updateProductAction } from "@/app/actions/product.actions";
import {
  productCreateYupSchema,
  productUpdateYupSchema,
  type ProductCreateFormValues,
} from "@/lib/validations/product-form.schema";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Category {
  id: number;
  nombre: string;
}

interface Supplier {
  id: number;
  nombre: string;
}

interface Unit {
  id: number;
  nombre: string;
  abreviatura: string;
}

interface SupplierPriceData {
  proveedorId: number;
  precio: number;
  codigoProveedor?: string | null;
}

interface ProductData {
  id: number;
  nombre: string;
  descripcion?: string | null;
  codigoBarras?: string | null;
  imagenUrl?: string | null;
  stock: number;
  stockMinimo: number;
  categoriaId?: number | null;
  unitId?: number | null;
  supplierPrices?: SupplierPriceData[];
}

interface ProductFormProps {
  product?: ProductData | null;
  categories: Category[];
  suppliers: Supplier[];
  units: Unit[];
}

export function ProductForm({ product, categories, suppliers, units }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;
  const [serverError, setServerError] = useState<string | null>(null);

  const categoryOptions = [
    { value: "", label: "Sin categoría" },
    ...categories.map((c) => ({ value: String(c.id), label: c.nombre })),
  ];

  const unitOptions = [
    { value: "", label: "Sin unidad" },
    ...units.map((u) => ({ value: String(u.id), label: `${u.nombre} (${u.abreviatura})` })),
  ];

  const supplierOptions = [
    { value: "", label: "Seleccionar proveedor..." },
    ...suppliers.map((s) => ({ value: String(s.id), label: s.nombre })),
  ];

  const methods = useForm<ProductCreateFormValues>({
    resolver: yupResolver(isEdit ? productUpdateYupSchema : productCreateYupSchema) as never,
    defaultValues: {
      nombre: product?.nombre ?? "",
      descripcion: product?.descripcion ?? "",
      codigoBarras: product?.codigoBarras ?? "",
      imagenUrl: product?.imagenUrl ?? "",
      categoriaId: product?.categoriaId ?? null,
      unitId: product?.unitId ?? null,
      stock: product?.stock ?? 0,
      stockMinimo: product?.stockMinimo ?? 0,
      supplierPrices:
        product?.supplierPrices?.map((sp) => ({
          proveedorId: sp.proveedorId,
          precio: sp.precio,
          codigoProveedor: sp.codigoProveedor ?? "",
        })) ?? [],
    },
  });

  const {
    handleSubmit,
    register,
    formState: { isSubmitting, errors },
  } = methods;

  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: "supplierPrices",
  });

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);

    const payload = {
      nombre: data.nombre,
      descripcion: data.descripcion || undefined,
      codigoBarras: data.codigoBarras || undefined,
      imagenUrl: data.imagenUrl || undefined,
      categoriaId: data.categoriaId ? Number(data.categoriaId) : null,
      unitId: data.unitId ? Number(data.unitId) : null,
      stock: data.stock ?? 0,
      stockMinimo: data.stockMinimo ?? 0,
      supplierPrices: (data.supplierPrices ?? [])
        .filter((sp) => sp.proveedorId)
        .map((sp) => ({
          proveedorId: Number(sp.proveedorId),
          precio: Number(sp.precio),
          codigoProveedor: sp.codigoProveedor || undefined,
        })),
    };

    if (isEdit) {
      const result = await updateProductAction(String(product.id), payload);
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
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="min-h-screen bg-muted/30">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard/productos")}
              >
                ← Volver
              </Button>
              <div>
                <h1 className="text-xl font-semibold">
                  {isEdit ? "Editar Producto" : "Nuevo Producto"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isEdit
                    ? "Modificá los datos del producto"
                    : "Completá los datos para agregar un nuevo producto"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
                  ? "Actualizar producto"
                  : "Guardar producto"}
              </Button>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="max-w-6xl mx-auto px-6 py-6">
          {serverError && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información general */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Información General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RhfInput
                    name="nombre"
                    label="Nombre del producto *"
                    placeholder="Ej: Cemento Portland 50kg"
                  />

                  <div className="space-y-1">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <textarea
                      id="descripcion"
                      {...register("descripcion")}
                      placeholder="Descripción opcional del producto..."
                      rows={3}
                      className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    />
                    {errors.descripcion && (
                      <p className="text-sm text-red-600">{errors.descripcion.message}</p>
                    )}
                  </div>

                  <RhfInput
                    name="codigoBarras"
                    label="Código de barras"
                    placeholder="Ej: 7790040123456"
                  />
                </CardContent>
              </Card>

              {/* Precios por proveedor */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Precios por Proveedor</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Asociá precios de compra a cada proveedor
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        append({ proveedorId: 0, precio: 0, codigoProveedor: "" })
                      }
                      disabled={suppliers.length === 0}
                    >
                      + Agregar proveedor
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {suppliers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay proveedores disponibles.
                    </p>
                  ) : fields.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No se agregaron proveedores. Usá el botón "Agregar proveedor".
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="grid grid-cols-1 sm:grid-cols-[1fr_140px_160px_auto] gap-3 items-end p-3 rounded-lg border bg-muted/20"
                        >
                          <div className="space-y-1">
                            <Label htmlFor={`supplierPrices.${index}.proveedorId`}>
                              Proveedor
                            </Label>
                            <select
                              id={`supplierPrices.${index}.proveedorId`}
                              {...register(`supplierPrices.${index}.proveedorId` as const)}
                              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                              {supplierOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                            {errors.supplierPrices?.[index]?.proveedorId && (
                              <p className="text-xs text-red-600">
                                {errors.supplierPrices[index]?.proveedorId?.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor={`supplierPrices.${index}.precio`}>
                              Precio ($)
                            </Label>
                            <Input
                              id={`supplierPrices.${index}.precio`}
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              {...register(`supplierPrices.${index}.precio` as const)}
                            />
                            {errors.supplierPrices?.[index]?.precio && (
                              <p className="text-xs text-red-600">
                                {errors.supplierPrices[index]?.precio?.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor={`supplierPrices.${index}.codigoProveedor`}>
                              Código proveedor
                            </Label>
                            <Input
                              id={`supplierPrices.${index}.codigoProveedor`}
                              placeholder="Opcional"
                              {...register(`supplierPrices.${index}.codigoProveedor` as const)}
                            />
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => remove(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-9"
                          >
                            Quitar
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Columna derecha */}
            <div className="space-y-6">
              {/* Organización */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Organización</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RhfSelect
                    name="categoriaId"
                    label="Categoría"
                    options={categoryOptions}
                  />
                  <RhfSelect
                    name="unitId"
                    label="Unidad de medida"
                    options={unitOptions}
                  />
                </CardContent>
              </Card>

              {/* Inventario */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Inventario</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RhfInput
                    name="stock"
                    label="Stock actual"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                  />
                  <RhfInput
                    name="stockMinimo"
                    label="Stock mínimo"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Se mostrará una alerta cuando el stock esté por debajo del mínimo.
                  </p>
                </CardContent>
              </Card>

              {/* Imagen */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Imagen</CardTitle>
                </CardHeader>
                <CardContent>
                  <RhfInput
                    name="imagenUrl"
                    label="URL de imagen"
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Ingresá la URL de una imagen del producto.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
