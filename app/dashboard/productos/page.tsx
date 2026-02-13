import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getAllProductsAction } from "@/app/actions/product.actions";
import { redirect } from "next/navigation";
import { requirePermission, Permission } from "@/lib/permissions";
import { ProductsTable } from "@/components/products/products-table";

export default async function ProductosPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  try {
    requirePermission(session.user.rol, Permission.PRODUCTOS_VER);
  } catch {
    redirect("/dashboard");
  }

  const result = await getAllProductsAction();

  if (!result.success) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Productos</h1>
        <p className="text-red-600">Error: {result.error}</p>
      </div>
    );
  }

  const products = result.data || [];

  return (
    <div className="p-6">
      <ProductsTable products={products as any} />
    </div>
  );
}

