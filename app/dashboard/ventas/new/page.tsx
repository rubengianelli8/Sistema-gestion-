import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { requirePermission, Permission } from "@/lib/permissions";
import { getAllCustomersAction } from "@/app/actions/customer.actions";
import { SalePageForm } from "@/components/sales/sale-page-form";

export default async function NuevaVentaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    requirePermission(session.user.rol, Permission.VENTAS_CREAR);
  } catch {
    redirect("/dashboard/ventas");
  }

  const customersResult = await getAllCustomersAction();

  const customers = customersResult.success
    ? (customersResult.data ?? []).map((c) => ({ id: c.id, nombre: c.nombre }))
    : [];

  return <SalePageForm customers={customers} />;
}
