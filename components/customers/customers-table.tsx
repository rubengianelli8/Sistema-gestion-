"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CustomerForm } from "./customer-form";
import { deleteCustomerAction } from "@/app/actions/customer.actions";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Client } from "@prisma/client";
import { toast } from "sonner";

/* interface Customer {
  id: number;
  nombre: string;
  dni: string;
  email?: string | null;
  telefono: string;
  direccion: string;
  activo: boolean;
} */

interface CustomersTableProps {
  customers: Client[];
}

export function CustomersTable({ customers: initialCustomers }: CustomersTableProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState(initialCustomers);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Client | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleAdd = () => {
    setEditingCustomer(null);
    setFormOpen(true);
  };

  const handleEdit = (customer: Client) => {
    setEditingCustomer(customer);
    setFormOpen(true);
  };

  const handleDeleteRequest = (id: number) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (pendingDeleteId === null) return;

    setDeleting(true);
    try {
      const result = await deleteCustomerAction(pendingDeleteId.toString());
      if (result.success) {
        toast.success("Cliente eliminado exitosamente");
        setCustomers(
          customers.map((c) =>
            c.id === pendingDeleteId ? { ...c, activo: false } : c,
          ),
        );
        router.refresh();
      } else {
        toast.error(result.error || "Error al eliminar el cliente");
      }
    } catch {
      toast.error("Error inesperado");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setPendingDeleteId(null);
    }
  };

  const handleFormSuccess = () => {
    router.refresh();
  };

  // Filtrar solo clientes activos para mostrar
  const activeCustomers = customers.filter(c => c.activo);

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Cliente
        </Button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="border border-gray-300 px-4 py-2 text-left">Nombre</th>
              <th className="border border-gray-300 px-4 py-2 text-left">DNI</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Teléfono</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Dirección</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {activeCustomers.length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                  No hay clientes registrados
                </td>
              </tr>
            ) : (
              activeCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">{customer.nombre}</td>
                  <td className="border border-gray-300 px-4 py-2">{customer.dni}</td>
                  <td className="border border-gray-300 px-4 py-2">{customer.email || "-"}</td>
                  <td className="border border-gray-300 px-4 py-2">{customer.telefono}</td>
                  <td className="border border-gray-300 px-4 py-2">{customer.direccion}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(customer)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteRequest(customer.id)}
                        disabled={deleting && pendingDeleteId === customer.id}
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

      <CustomerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={editingCustomer}
        onSuccess={handleFormSuccess}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setPendingDeleteId(null);
        }}
        title="¿Eliminar cliente?"
        description="Esta acción no se puede deshacer. El cliente se marcará como inactivo."
        confirmLabel="Eliminar"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}

