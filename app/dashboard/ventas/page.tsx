import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getAllSalesAction } from "@/app/actions/sale.actions";
import { redirect } from "next/navigation";
import {
  requirePermission,
  Permission,
  hasPermission,
} from "@/lib/permissions";
import { SalesTable } from "@/components/sales/sales-table";

export default async function VentasPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  try {
    requirePermission(session.user.rol, Permission.VENTAS_VER);
  } catch {
    redirect("/dashboard");
  }

  const salesResult = await getAllSalesAction();

  if (!salesResult.success) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Ventas</h1>
        <p className="text-red-600">Error: {salesResult.error}</p>
      </div>
    );
  }

  const canAnular = hasPermission(
    session.user.rol,
    Permission.VENTAS_ANULAR,
  );

  const sales = (salesResult.data || []).map((s) => ({
    id: s.id,
    clienteId: s.clienteId,
    vendedorNombre: s.vendedor?.name ?? "—",
    total: s.total,
    metodoPago: String(s.metodoPago),
    fecha: s.fecha,
    estado: s.estado,
    cliente: s.cliente ? { nombre: s.cliente.nombre } : null,
  }));

  return (
    <div className="p-6">
      <SalesTable sales={sales} canAnular={canAnular} />
    </div>
  );
}
