import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { requirePermission, Permission } from "@/lib/permissions";

export default async function DepositosPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  try {
    requirePermission(session.user.rol, Permission.DEPOSITOS_VER);
  } catch {
    redirect("/dashboard");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Depósitos</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Gestión de depósitos - En desarrollo</p>
      </div>
    </div>
  );
}

