import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getAllCategoriesAction } from "@/app/actions/category.actions";
import { redirect } from "next/navigation";
import { requirePermission, Permission } from "@/lib/permissions";
import { CategoriesTable } from "@/components/categories/categories-table";

export default async function CategoriasPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  try {
    requirePermission(session.user.rol, Permission.PRODUCTOS_VER);
  } catch {
    redirect("/dashboard");
  }

  const result = await getAllCategoriesAction();

  if (!result.success) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Categorías</h1>
        <p className="text-red-600">Error: {result.error}</p>
      </div>
    );
  }

  const categories = result.data || [];

  return (
    <div className="p-6">
      <CategoriesTable categories={categories} />
    </div>
  );
}
