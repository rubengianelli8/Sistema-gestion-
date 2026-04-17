import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { requirePermission, Permission } from "@/lib/permissions";
import { getAllSuppliersAction } from "@/app/actions/supplier.actions";
import { getProductsForPurchaseAction } from "@/app/actions/purchase.actions";
import { PurchaseForm } from "@/components/purchases/purchase-form";

export default async function NuevaCompraPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  try {
    requirePermission(session.user.rol, Permission.COMPRAS_CREAR);
  } catch {
    redirect("/dashboard");
  }

  const [suppliersResult, productsResult] = await Promise.all([
    getAllSuppliersAction(),
    getProductsForPurchaseAction(),
  ]);

  if (!suppliersResult.success || !suppliersResult.data) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Nueva compra</h1>
        <p className="text-red-600">
          Error al cargar proveedores: {suppliersResult.error}
        </p>
      </div>
    );
  }

  if (!productsResult.success || !productsResult.data) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Nueva compra</h1>
        <p className="text-red-600">
          Error al cargar productos: {productsResult.error}
        </p>
      </div>
    );
  }

  return (
    <PurchaseForm
      suppliers={suppliersResult.data}
      products={productsResult.data}
    />
  );
}
