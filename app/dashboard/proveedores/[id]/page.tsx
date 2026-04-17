import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect, notFound } from "next/navigation";
import { requirePermission, Permission } from "@/lib/permissions";
import { getSupplierByIdAction } from "@/app/actions/supplier.actions";
import { SupplierForm } from "@/components/suppliers/supplier-form";

interface EditarProveedorPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarProveedorPage({
  params,
}: EditarProveedorPageProps) {
  const { id } = await params;

  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  try {
    requirePermission(session.user.rol, Permission.PROVEEDORES_EDITAR);
  } catch {
    redirect("/dashboard");
  }

  const result = await getSupplierByIdAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return <SupplierForm supplier={result.data} />;
}
