import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { requirePermission, Permission } from "@/lib/permissions";
import { SupplierForm } from "@/components/suppliers/supplier-form";

export default async function NuevoProveedorPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  try {
    requirePermission(session.user.rol, Permission.PROVEEDORES_CREAR);
  } catch {
    redirect("/dashboard");
  }

  return <SupplierForm />;
}
