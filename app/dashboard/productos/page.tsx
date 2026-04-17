import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getPaginatedProductsAction } from "@/app/actions/product.actions";
import { redirect } from "next/navigation";
import { requirePermission, Permission, hasPermission } from "@/lib/permissions";
import { ProductsTable } from "@/components/products/products-table";

const DEFAULT_PAGE_SIZE = 20;

interface SearchParams {
  q?: string;
  page?: string;
  pageSize?: string;
}

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
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

  const resolvedSearchParams = await searchParams;
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1);
  const pageSize = Math.max(1, Number(resolvedSearchParams.pageSize) || DEFAULT_PAGE_SIZE);
  const q = (resolvedSearchParams.q ?? "").trim();

  const result = await getPaginatedProductsAction({
    q: q || undefined,
    page,
    pageSize,
  });

  if (!result.success || !result.data) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Productos</h1>
        <p className="text-red-600">Error: {result.error}</p>
      </div>
    );
  }

  const { items: products, total } = result.data;
  const canCreatePurchase = hasPermission(
    session.user.rol,
    Permission.COMPRAS_CREAR,
  );

  return (
    <div className="p-6">
      <ProductsTable
        products={products as any}
        page={page}
        pageSize={pageSize}
        total={total}
        initialQuery={q}
        canCreatePurchase={canCreatePurchase}
      />
    </div>
  );
}

