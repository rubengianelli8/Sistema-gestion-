import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getAllProductsAction } from "@/app/actions/product.actions";
import { redirect } from "next/navigation";
import { requirePermission, Permission } from "@/lib/permissions";
import { ProductsTable } from "@/components/products/products-table";

const DEFAULT_PAGE_SIZE = 20;

interface SearchParams {
  page?: string;
  pageSize?: string;
}

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  try {
    requirePermission(session.user.rol, Permission.PRODUCTOS_VER);
  } catch {
    redirect("/dashboard");
  }

  const page = Math.max(1, Number(searchParams.page) || 1);
  const pageSize = Math.max(1, Number(searchParams.pageSize) || DEFAULT_PAGE_SIZE);

  const result = await getAllProductsAction();

  if (!result.success) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Productos</h1>
        <p className="text-red-600">Error: {result.error}</p>
      </div>
    );
  }

  const allProducts = result.data || [];
  const total = allProducts.length;
  const start = (page - 1) * pageSize;
  const products = allProducts.slice(start, start + pageSize);

  return (
    <div className="p-6">
      <ProductsTable
        products={products as any}
        page={page}
        pageSize={pageSize}
        total={total}
      />
    </div>
  );
}

