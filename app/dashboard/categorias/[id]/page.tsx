import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect, notFound } from "next/navigation";
import { requirePermission, Permission } from "@/lib/permissions";
import { getCategoryByIdAction } from "@/app/actions/category.actions";
import { CategoryForm } from "@/components/categories/category-form";

interface EditarCategoriaPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarCategoriaPage({
  params,
}: EditarCategoriaPageProps) {
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

  const result = await getCategoryByIdAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return <CategoryForm category={result.data} />;
}
