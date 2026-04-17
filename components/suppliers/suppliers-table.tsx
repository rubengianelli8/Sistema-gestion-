"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteSupplierAction } from "@/app/actions/supplier.actions";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Supplier } from "@prisma/client";
import { toast } from "sonner";

interface SuppliersTableProps {
  suppliers: Supplier[];
}

export function SuppliersTable({
  suppliers: initialSuppliers,
}: SuppliersTableProps) {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setSuppliers(initialSuppliers);
  }, [initialSuppliers]);

  const handleDeleteRequest = (id: number) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (pendingDeleteId === null) return;

    setDeleting(true);
    try {
      const result = await deleteSupplierAction(pendingDeleteId.toString());
      if (result.success) {
        toast.success("Proveedor eliminado exitosamente");
        setSuppliers(
          suppliers.map((s) =>
            s.id === pendingDeleteId ? { ...s, activo: false } : s,
          ),
        );
        router.refresh();
      } else {
        toast.error(result.error || "Error al eliminar el proveedor");
      }
    } catch {
      toast.error("Error inesperado");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setPendingDeleteId(null);
    }
  };

  const activeSuppliers = suppliers.filter((s) => s.activo);

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Proveedores</h1>
        <Button onClick={() => router.push("/dashboard/proveedores/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar proveedor
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
                Contacto
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Email
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Teléfono
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                CUIT
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Dirección
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {activeSuppliers.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="border border-gray-300 px-4 py-8 text-center text-gray-500"
                >
                  No hay proveedores registrados
                </td>
              </tr>
            ) : (
              activeSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">
                    {supplier.nombre}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {supplier.contacto || "-"}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {supplier.email || "-"}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {supplier.telefono || "-"}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {supplier.cuit || "-"}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {supplier.direccion || "-"}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/proveedores/${supplier.id}`)
                        }
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteRequest(supplier.id)}
                        disabled={deleting && pendingDeleteId === supplier.id}
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
        title="¿Eliminar proveedor?"
        description="Esta acción no se puede deshacer. El proveedor se marcará como inactivo."
        confirmLabel="Eliminar"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
