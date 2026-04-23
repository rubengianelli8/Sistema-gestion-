import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { requirePermission, Permission } from "@/lib/permissions";
import { getAllCustomersAction } from "@/app/actions/customer.actions";
import { getAllProductsAction } from "@/app/actions/product.actions";
import { SalePageForm } from "@/components/sales/sale-page-form";

export default async function NuevaVentaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    requirePermission(session.user.rol, Permission.VENTAS_CREAR);
  } catch {
    redirect("/dashboard/ventas");
  }

  const [customersResult, productsResult] = await Promise.all([
    getAllCustomersAction(),
    getAllProductsAction(),
  ]);

  const customers = customersResult.success
    ? (customersResult.data ?? []).map((c) => ({ id: c.id, nombre: c.nombre }))
    : [];
  const products = productsResult.success
    ? (productsResult.data ?? []).map((p) => ({
        id: p.id,
        nombre: p.nombre,
        imagenUrl: p.imagenUrl,
        codigoBarras: p.codigoBarras ?? null,
        precio: p.precio ?? 0,
        stockActual: p.stock,
      }))
    : [];

  return <SalePageForm customers={customers} products={products} />;
}
