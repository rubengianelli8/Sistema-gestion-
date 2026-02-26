import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getAllUsersAction } from "@/app/actions/user.actions";
import { redirect } from "next/navigation";
import { requirePermission, Permission } from "@/lib/permissions";
import { UsersTable } from "@/components/users/users-table";

export default async function UsuariosPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  try {
    requirePermission(session.user.rol, Permission.USUARIOS_VER);
  } catch {
    redirect("/dashboard");
  }

  const result = await getAllUsersAction();

  if (!result.success) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Usuarios</h1>
        <p className="text-red-600">Error: {result.error}</p>
      </div>
    );
  }

  const users = result.data || [];

  return (
    <div className="p-6">
      <UsersTable users={users} />
    </div>
  );
}
