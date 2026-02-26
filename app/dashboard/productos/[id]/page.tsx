import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect, notFound } from "next/navigation";
import { requirePermission, Permission } from "@/lib/permissions";
import { getProductByIdAction } from "@/app/actions/product.actions";
import { ProductForm } from "@/components/products/product-form";

interface EditarProductoPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarProductoPage({ params }: EditarProductoPageProps) {
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

  const result = await getProductByIdAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="p-6">
      <ProductForm product={result.data} />
    </div>
  );
}
