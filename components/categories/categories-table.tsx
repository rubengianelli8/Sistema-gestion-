"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteCategoryAction } from "@/app/actions/category.actions";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Category } from "@prisma/client";
import { toast } from "sonner";

interface CategoriesTableProps {
  categories: Category[];
}

export function CategoriesTable({
  categories: initialCategories,
}: CategoriesTableProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const handleDeleteRequest = (id: number) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (pendingDeleteId === null) return;

    setDeleting(true);
    try {
      const result = await deleteCategoryAction(pendingDeleteId.toString());
      if (result.success) {
        toast.success("Categoría eliminada exitosamente");
        setCategories((prev) => prev.filter((c) => c.id !== pendingDeleteId));
        router.refresh();
      } else {
        toast.error(result.error || "Error al eliminar la categoría");
      }
    } catch {
      toast.error("Error inesperado");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setPendingDeleteId(null);
    }
  };

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Categorías</h1>
        <Button onClick={() => router.push("/dashboard/categorias/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar categoría
        </Button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="border border-gray-300 px-4 py-2 text-left">
                Nombre
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Descripción
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Fecha creación
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="border border-gray-300 px-4 py-8 text-center text-gray-500"
                >
                  No hay categorías registradas
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">
                    {category.nombre}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {category.descripcion || "-"}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {new Date(category.createdAt).toLocaleDateString("es-AR")}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/categorias/${category.id}`)
                        }
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteRequest(category.id)}
                        disabled={
                          deleting && pendingDeleteId === category.id
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setPendingDeleteId(null);
        }}
        title="¿Eliminar categoría?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
