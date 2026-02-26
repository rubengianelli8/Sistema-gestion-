"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteUserAction } from "@/app/actions/user.actions";
import { Pencil, Trash2, Plus } from "lucide-react";
import { UserRole } from "@prisma/client";

interface User {
  id: number;
  email: string;
  name: string;
  rol: UserRole;
  estado: boolean;
  businessId: number | null;
  lastLogin: Date | null;
}

interface UsersTableProps {
  users: User[];
}

const rolLabels: Record<UserRole, string> = {
  SUPERADMIN: "Super Admin",
  ADMIN: "Administrador",
  VENDEDOR: "Vendedor",
  ALMACENERO: "Almacenero",
  REPOSITOR: "Repositor",
  CONTADOR: "Contador",
};

export function UsersTable({ users: initialUsers }: UsersTableProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleNew = () => {
    router.push("/dashboard/usuarios/new");
  };

  const handleEdit = (id: number) => {
    router.push(`/dashboard/usuarios/${id}`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas desactivar este usuario?")) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await deleteUserAction(id.toString());
      if (result.success) {
        setUsers(users.map((u) => (u.id === id ? { ...u, estado: false } : u)));
        router.refresh();
      } else {
        alert(result.error || "Error al desactivar el usuario");
      }
    } catch {
      alert("Error al desactivar el usuario");
    } finally {
      setDeletingId(null);
    }
  };

  const activeUsers = users.filter((u) => u.estado);

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="border border-gray-300 px-4 py-2 text-left">Nombre</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Rol</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Estado</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Último Login</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {activeUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="border border-gray-300 px-4 py-8 text-center text-gray-500"
                >
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              activeUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">{user.name}</td>
                  <td className="border border-gray-300 px-4 py-2">{user.email}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {rolLabels[user.rol] ?? user.rol}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.estado
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.estado ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleString("es-AR")
                      : "Nunca"}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(user.id)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                        disabled={deletingId === user.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
