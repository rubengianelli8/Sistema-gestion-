"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProductForm } from "./product-form";
import { deleteProductAction } from "@/app/actions/product.actions";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface Product {
  id: number;
  nombre: string;
  codigoBarras?: string | null;
  precioMinorista: number;
  precioMayorista: number;
  stockActual: number;
}

interface ProductsTableProps {
  products: Product[];
}

export function ProductsTable({ products: initialProducts }: ProductsTableProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleAdd = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await deleteProductAction(id.toString());
      if (result.success) {
        setProducts(products.filter((p) => p.id !== id));
      } else {
        alert(result.error || "Error al eliminar el producto");
      }
    } catch (error) {
      alert("Error al eliminar el producto");
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Productos</h1>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Producto
        </Button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="border border-gray-300 px-4 py-2 text-left">Nombre</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Código Barras</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Precio Minorista</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Precio Mayorista</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Stock</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                  No hay productos registrados
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">{product.nombre}</td>
                  <td className="border border-gray-300 px-4 py-2">{product.codigoBarras || "-"}</td>
                  <td className="border border-gray-300 px-4 py-2">${product.precioMinorista.toFixed(2)}</td>
                  <td className="border border-gray-300 px-4 py-2">${product.precioMayorista.toFixed(2)}</td>
                  <td className="border border-gray-300 px-4 py-2">{product.stockActual}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        disabled={deletingId === product.id}
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

      <ProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editingProduct}
        onSuccess={handleFormSuccess}
      />
    </>
  );
}

