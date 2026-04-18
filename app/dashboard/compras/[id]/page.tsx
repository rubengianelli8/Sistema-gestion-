import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  requirePermission,
  Permission,
  hasPermission,
} from "@/lib/permissions";
import { getPurchaseByIdAction } from "@/app/actions/purchase.actions";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CancelPurchaseButton } from "@/components/purchases/cancel-purchase-button";
import { PurchaseStatus } from "@prisma/client";

interface CompraDetallePageProps {
  params: Promise<{ id: string }>;
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

export default async function CompraDetallePage({
  params,
}: CompraDetallePageProps) {
  const { id } = await params;

  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  try {
    requirePermission(session.user.rol, Permission.COMPRAS_VER);
  } catch {
    redirect("/dashboard");
  }

  const result = await getPurchaseByIdAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const p = result.data;
  const canAnular = hasPermission(session.user.rol, Permission.COMPRAS_ANULAR);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/compras">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Compra #{p.id}</h1>
        <span className={estadoBadge(p.estado)}>{estadoLabel(p.estado)}</span>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow border p-4">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Fecha</dt>
              <dd>{new Date(p.fecha).toLocaleString("es-AR")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Nº factura</dt>
              <dd>{p.numeroFactura || "—"}</dd>
            </div>
            {p.notas ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Notas</dt>
                <dd>{p.notas}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow border p-4">
          <h2 className="font-semibold mb-3">Proveedor</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Nombre</dt>
              <dd>{p.proveedor.nombre}</dd>
            </div>
            {p.proveedor.cuit ? (
              <div>
                <dt className="text-muted-foreground">CUIT</dt>
                <dd>{p.proveedor.cuit}</dd>
              </div>
            ) : null}
            {p.proveedor.email ? (
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd>{p.proveedor.email}</dd>
              </div>
            ) : null}
            {p.proveedor.telefono ? (
              <div>
                <dt className="text-muted-foreground">Teléfono</dt>
                <dd>{p.proveedor.telefono}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="overflow-x-auto bg-white rounded-lg shadow border">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Producto
                </th>
                <th className="border border-gray-300 px-4 py-2 text-right">
                  Cantidad
                </th>
                <th className="border border-gray-300 px-4 py-2 text-right">
                  Precio unit.
                </th>
                <th className="border border-gray-300 px-4 py-2 text-right">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {p.items.map((item) => (
                <tr key={item.id}>
                  <td className="border border-gray-300 px-4 py-2">
                    {item.productoNombre}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {item.cantidad}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    ${item.precioUnitario.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    ${item.subtotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-lg font-semibold">
            Total: <span className="text-primary">${p.total.toFixed(2)}</span>
          </p>
          <CancelPurchaseButton
            purchaseId={p.id}
            estado={p.estado}
            canAnular={canAnular}
            variant="destructive"
            size="default"
            showLabel
          />
        </div>
      </div>
    </div>
  );
}
