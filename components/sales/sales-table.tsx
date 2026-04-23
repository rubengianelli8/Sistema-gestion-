"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { SaleStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { CancelSaleButton } from "@/components/sales/cancel-sale-button";

interface Sale {
  id: number;
  clienteId: number | null;
  vendedorNombre: string;
  total: number;
  metodoPago: string;
  fecha: Date;
  estado: SaleStatus;
  cliente: {
    nombre: string;
  } | null;
}

interface SalesTableProps {
  sales: Sale[];
  canAnular: boolean;
}

function estadoBadge(estado: SaleStatus) {
  switch (estado) {
    case SaleStatus.COMPLETADA:
      return { label: "Completada", className: "bg-emerald-100 text-emerald-800" };
    case SaleStatus.PENDIENTE:
      return { label: "Pendiente", className: "bg-gray-100 text-gray-800" };
    case SaleStatus.ANULADA:
      return { label: "Anulada", className: "bg-red-100 text-red-800" };
    default:
      return { label: String(estado), className: "bg-gray-100 text-gray-800" };
  }
}

export function SalesTable({ sales, canAnular }: SalesTableProps) {
  const router = useRouter();

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Ventas</h1>
        <Button onClick={() => router.push("/dashboard/ventas/new")}>
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
              <th className="border border-gray-300 px-4 py-2 text-left">Estado</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="border border-gray-300 px-4 py-8 text-center text-gray-500"
                >
                  No hay ventas registradas
                </td>
              </tr>
            ) : (
              sales.map((sale) => {
                const badge = estadoBadge(sale.estado);
                return (
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
                    <td className="border border-gray-300 px-4 py-2">
                      {sale.vendedorNombre}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {sale.metodoPago}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 font-semibold">
                      ${sale.total.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                          badge.className,
                        )}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <CancelSaleButton
                        saleId={sale.id}
                        estado={sale.estado}
                        canAnular={canAnular}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
