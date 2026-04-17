import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getAllSuppliersAction } from "@/app/actions/supplier.actions";
import { redirect } from "next/navigation";
import { requirePermission, Permission } from "@/lib/permissions";
import { SuppliersTable } from "@/components/suppliers/suppliers-table";

export default async function ProveedoresPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  try {
    requirePermission(session.user.rol, Permission.PROVEEDORES_VER);
  } catch {
    redirect("/dashboard");
  }

  const result = await getAllSuppliersAction();

  if (!result.success) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Proveedores</h1>
        <p className="text-red-600">Error: {result.error}</p>
      </div>
    );
  }

  const suppliers = result.data || [];

  return (
    <div className="p-6">
      <SuppliersTable suppliers={suppliers} />
    </div>
  );
}
