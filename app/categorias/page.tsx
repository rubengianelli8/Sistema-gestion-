import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getAllCategoriesAction } from "@/app/actions/category.actions";
import { redirect } from "next/navigation";
import { requirePermission, Permission } from "@/lib/permissions";

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
      <h1 className="text-2xl font-bold mb-4">Categorías</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">Nombre</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Descripción</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Fecha Creación</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="border border-gray-300 px-4 py-2">{category.nombre}</td>
                <td className="border border-gray-300 px-4 py-2">{category.descripcion || "-"}</td>
                <td className="border border-gray-300 px-4 py-2">
                  {new Date(category.createdAt).toLocaleDateString("es-AR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

