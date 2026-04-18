import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getAllSalesAction } from "@/app/actions/sale.actions";
import { getAllCustomersAction } from "@/app/actions/customer.actions";
import { getAllProductsAction } from "@/app/actions/product.actions";
import { redirect } from "next/navigation";
import { requirePermission, Permission } from "@/lib/permissions";
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

  const [salesResult, customersResult, productsResult] = await Promise.all([
    getAllSalesAction(),
    getAllCustomersAction(),
    getAllProductsAction(),
  ]);

  if (!salesResult.success) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Ventas</h1>
        <p className="text-red-600">Error: {salesResult.error}</p>
      </div>
    );
  }

  const sales = (salesResult.data || []).map((s) => ({
    id: s.id,
    clienteId: s.clienteId,
    vendedorNombre: s.vendedor?.name ?? "—",
    total: s.total,
    metodoPago: String(s.metodoPago),
    fecha: s.fecha,
    cliente: s.cliente ? { nombre: s.cliente.nombre } : null,
  }));
  const customers = customersResult.success ? customersResult.data || [] : [];
  const products = productsResult.success
    ? (productsResult.data || []).map((product) => ({
        id: product.id,
        nombre: product.nombre,
        imagenUrl: product.imagenUrl,
        codigoBarras: product.codigoBarras ?? null,
        precio: product.precio ?? 0,
        stockActual: product.stock,
      }))
    : [];

  return (
    <div className="p-6">
      <SalesTable sales={sales} customers={customers} products={products} />
    </div>
  );
}
