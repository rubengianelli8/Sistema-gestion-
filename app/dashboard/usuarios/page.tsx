import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getAllUsersAction } from "@/app/actions/user.actions";
import { redirect } from "next/navigation";
import { requirePermission, Permission } from "@/lib/permissions";

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
      <h1 className="text-2xl font-bold mb-4">Usuarios</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Nombre</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Rol</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Estado</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Último Login</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="border border-gray-300 px-4 py-2">{user.email}</td>
                <td className="border border-gray-300 px-4 py-2">{user.name}</td>
                <td className="border border-gray-300 px-4 py-2">{user.rol}</td>
                <td className="border border-gray-300 px-4 py-2">
                  {user.estado ? "Activo" : "Inactivo"}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {user.lastLogin
                    ? new Date(user.lastLogin).toLocaleString("es-AR")
                    : "Nunca"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

