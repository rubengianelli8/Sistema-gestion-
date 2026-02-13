"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SaleForm } from "./sale-form";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface Sale {
  id: number;
  clienteId: number | null;
  vendedorNombre: string;
  total: number;
  metodoPago: string;
  fecha: Date;
  cliente: {
    nombre: string;
  } | null;
}

interface SalesTableProps {
  sales: Sale[];
  customers: Array<{ id: number; nombre: string }>;
  products: Array<{ id: number; nombre: string; precioMinorista: number; stockActual: number }>;
}

export function SalesTable({ sales: initialSales, customers, products }: SalesTableProps) {
  const router = useRouter();
  const [sales] = useState(initialSales);
  const [formOpen, setFormOpen] = useState(false);

  const handleFormSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Ventas</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Venta
        </Button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="border border-gray-300 px-4 py-2 text-left">ID</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Fecha</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Cliente</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Vendedor</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Método de Pago</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Total</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                  No hay ventas registradas
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">#{sale.id}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {new Date(sale.fecha).toLocaleDateString("es-AR", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {sale.cliente?.nombre || "Sin cliente"}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">{sale.vendedorNombre}</td>
                  <td className="border border-gray-300 px-4 py-2">{sale.metodoPago}</td>
                  <td className="border border-gray-300 px-4 py-2 font-semibold">
                    ${sale.total.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <SaleForm
        open={formOpen}
        onOpenChange={setFormOpen}
        customers={customers}
        products={products}
        onSuccess={handleFormSuccess}
      />
    </>
  );
}

