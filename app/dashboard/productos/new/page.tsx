import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { requirePermission, Permission } from "@/lib/permissions";
import { ProductForm } from "@/components/products/product-form";
import { getAllCategoriesAction } from "@/app/actions/category.actions";
import { getAllSuppliersAction } from "@/app/actions/supplier.actions";
import { getAllUnitsAction } from "@/app/actions/unit.actions";

export default async function NuevoProductoPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  try {
    requirePermission(session.user.rol, Permission.PRODUCTOS_CREAR);
  } catch {
    redirect("/dashboard");
  }

  const [categoriesResult, suppliersResult, unitsResult] = await Promise.all([
    getAllCategoriesAction(),
    getAllSuppliersAction(),
    getAllUnitsAction(),
  ]);

  const categories = categoriesResult.success ? (categoriesResult.data ?? []) : [];
  const suppliers = suppliersResult.success ? (suppliersResult.data ?? []) : [];
  const units = unitsResult.success ? (unitsResult.data ?? []) : [];

  return (
    <ProductForm
      categories={categories}
      suppliers={suppliers}
      units={units}
    />
  );
}
