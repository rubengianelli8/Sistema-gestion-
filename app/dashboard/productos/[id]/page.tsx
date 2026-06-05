import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect, notFound } from "next/navigation";
import { requirePermission, Permission } from "@/lib/permissions";
import { getProductByIdAction } from "@/app/actions/product.actions";
import { getAllCategoriesAction } from "@/app/actions/category.actions";
import { getAllSuppliersAction } from "@/app/actions/supplier.actions";
import { getAllUnitsAction } from "@/app/actions/unit.actions";
import { ProductForm } from "@/components/products/product-form";

interface EditarProductoPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarProductoPage({
  params,
}: EditarProductoPageProps) {
  const { id } = await params;

  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  try {
    requirePermission(session.user.rol, Permission.PRODUCTOS_EDITAR);
  } catch {
    redirect("/dashboard");
  }

  const [productResult, categoriesResult, suppliersResult, unitsResult] =
    await Promise.all([
      getProductByIdAction(id),
      getAllCategoriesAction(),
      getAllSuppliersAction(),
      getAllUnitsAction(),
    ]);

  if (!productResult.success || !productResult.data) {
    notFound();
  }

  const categories = categoriesResult.success ? (categoriesResult.data ?? []) : [];
  const suppliers = suppliersResult.success ? (suppliersResult.data ?? []) : [];
  const units = unitsResult.success ? (unitsResult.data ?? []) : [];

  return (
    <ProductForm
      product={productResult.data}
      categories={categories}
      suppliers={suppliers}
      units={units}
    />
  );
}
