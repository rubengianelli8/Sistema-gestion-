import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { requirePermission, Permission } from "@/lib/permissions";
import { CategoryForm } from "@/components/categories/category-form";

export default async function NuevaCategoriaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  try {
    requirePermission(session.user.rol, Permission.PRODUCTOS_CREAR);
  } catch {
    redirect("/dashboard");
  }

  return <CategoryForm />;
}
