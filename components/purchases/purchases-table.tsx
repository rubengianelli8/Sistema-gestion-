"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Plus, Eye } from "lucide-react";
import type { Purchase, Supplier, PurchaseItem, Product } from "@prisma/client";
import { PurchaseStatus } from "@prisma/client";
import { CancelPurchaseButton } from "@/components/purchases/cancel-purchase-button";

export type PurchaseWithRelations = Purchase & {
  proveedor: Supplier;
  items: (PurchaseItem & { producto: Product | null })[];
};

interface PurchasesTableProps {
  purchases: PurchaseWithRelations[];
  canCrear: boolean;
  canAnular: boolean;
}

function estadoBadge(estado: PurchaseStatus) {
  const base =
    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium";
  switch (estado) {
    case PurchaseStatus.RECIBIDA:
      return `${base} bg-green-100 text-green-800`;
    case PurchaseStatus.CANCELADA:
      return `${base} bg-red-100 text-red-800`;
    default:
      return `${base} bg-gray-100 text-gray-800`;
  }
}

function estadoLabel(estado: PurchaseStatus) {
  switch (estado) {
    case PurchaseStatus.PENDIENTE:
      return "Pendiente";
    case PurchaseStatus.RECIBIDA:
      return "Recibida";
    case PurchaseStatus.PARCIAL:
      return "Parcial";
    case PurchaseStatus.CANCELADA:
      return "Anulada";
    default:
      return estado;
  }
}

export function PurchasesTable({
  purchases: initialPurchases,
  canCrear,
  canAnular,
}: PurchasesTableProps) {
  const router = useRouter();
  const [purchases, setPurchases] = useState(initialPurchases);

  useEffect(() => {
    setPurchases(initialPurchases);
  }, [initialPurchases]);

  return (
    <>
      <div className="mb-4 flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Compras</h1>
        {canCrear ? (
          <Button onClick={() => router.push("/dashboard/compras/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva compra
          </Button>
        ) : null}
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="border border-gray-300 px-4 py-2 text-left">
                Fecha
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Nº factura
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Proveedor
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Ítems
              </th>
              <th className="border border-gray-300 px-4 py-2 text-right">
                Total
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Estado
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {purchases.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="border border-gray-300 px-4 py-8 text-center text-gray-500"
                >
                  No hay compras registradas
                </td>
              </tr>
            ) : (
              purchases.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 whitespace-nowrap">
                    {new Date(p.fecha).toLocaleString("es-AR")}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {p.numeroFactura || "-"}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {p.proveedor.nombre}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {p.items.length}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    ${p.total.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <span className={estadoBadge(p.estado)}>
                      {estadoLabel(p.estado)}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/compras/${p.id}`)
                        }
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <CancelPurchaseButton
                        purchaseId={p.id}
                        estado={p.estado}
                        canAnular={canAnular}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
