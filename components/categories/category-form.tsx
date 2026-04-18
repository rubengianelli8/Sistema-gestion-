"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createCategoryAction,
  updateCategoryAction,
} from "@/app/actions/category.actions";
import { toast } from "sonner";
import type { CategoryCreateInput } from "@/lib/validations/category.schema";
import type { Category } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryFormProps {
  category?: Category | null;
}

export function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter();
  const isEdit = !!category?.id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
  });

  useEffect(() => {
    if (category) {
      setFormData({
        nombre: category.nombre ?? "",
        descripcion: category.descripcion ?? "",
      });
    } else {
      setFormData({ nombre: "", descripcion: "" });
    }
    setError(null);
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data: CategoryCreateInput = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
      };

      if (category?.id) {
        const result = await updateCategoryAction(
          category.id.toString(),
          data,
        );
        if (!result.success) {
          const msg = result.error || "Error al actualizar la categoría";
          setError(msg);
          toast.error(msg);
          return;
        }
        toast.success("Categoría actualizada exitosamente");
      } else {
        const result = await createCategoryAction(data);
        if (!result.success) {
          const msg = result.error || "Error al crear la categoría";
          setError(msg);
          toast.error(msg);
          return;
        }
        toast.success("Categoría creada exitosamente");
      }

      router.push("/dashboard/categorias");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setError(msg);
      toast.error("Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/categorias")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold">
          {isEdit ? "Editar categoría" : "Nueva categoría"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <Label htmlFor="nombre">Nombre *</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) =>
              setFormData({ ...formData, nombre: e.target.value })
            }
            required
            placeholder="Nombre de la categoría"
          />
        </div>

        <div>
          <Label htmlFor="descripcion">Descripción</Label>
          <textarea
            id="descripcion"
            value={formData.descripcion}
            onChange={(e) =>
              setFormData({ ...formData, descripcion: e.target.value })
            }
            placeholder="Descripción opcional"
            rows={4}
            className={cn(
              "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            )}
          />
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/categorias")}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : isEdit ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </form>
    </div>
  );
}
