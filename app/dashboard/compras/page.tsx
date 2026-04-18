import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import {
  requirePermission,
  Permission,
  hasPermission,
} from "@/lib/permissions";
import { getAllPurchasesAction } from "@/app/actions/purchase.actions";
import { PurchasesTable } from "@/components/purchases/purchases-table";

export default async function ComprasPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  try {
    requirePermission(session.user.rol, Permission.COMPRAS_VER);
  } catch {
    redirect("/dashboard");
  }

  const result = await getAllPurchasesAction();

  if (!result.success) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Compras</h1>
        <p className="text-red-600">Error: {result.error}</p>
      </div>
    );
  }

  const purchases = result.data ?? [];
  const canCrear = hasPermission(session.user.rol, Permission.COMPRAS_CREAR);
  const canAnular = hasPermission(session.user.rol, Permission.COMPRAS_ANULAR);

  return (
    <div className="p-6">
      <PurchasesTable
        purchases={purchases}
        canCrear={canCrear}
        canAnular={canAnular}
      />
    </div>
  );
}
