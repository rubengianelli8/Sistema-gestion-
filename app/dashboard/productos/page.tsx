import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getAllProductsAction } from "@/app/actions/product.actions";
import { redirect } from "next/navigation";
import { requirePermission, Permission } from "@/lib/permissions";

export default async function ProductosPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  try {
    requirePermission(session.user.rol, Permission.PRODUCTOS_VER);
  } catch {
    redirect("/dashboard");
  }

  const result = await getAllProductsAction();

  if (!result.success) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Productos</h1>
        <p className="text-red-600">Error: {result.error}</p>
      </div>
    );
  }

  const products = result.data || [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Productos</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">Nombre</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Código Barras</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Precio Minorista</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td className="border border-gray-300 px-4 py-2">{product.nombre}</td>
                <td className="border border-gray-300 px-4 py-2">{product.codigoBarras || "-"}</td>
                <td className="border border-gray-300 px-4 py-2">${product.precioMinorista}</td>
                <td className="border border-gray-300 px-4 py-2">{product.stockActual}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

