import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { requirePermission, Permission } from "@/lib/permissions";

export default async function ProveedoresPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  try {
    requirePermission(session.user.rol, Permission.PROVEEDORES_VER);
  } catch {
    redirect("/dashboard");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Proveedores</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Gestión de proveedores - En desarrollo</p>
      </div>
    </div>
  );
}

