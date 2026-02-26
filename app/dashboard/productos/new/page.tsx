import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { requirePermission, Permission } from "@/lib/permissions";
import { ProductForm } from "@/components/products/product-form";

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

  return (
    <div className="p-6">
      <ProductForm />
    </div>
  );
}
