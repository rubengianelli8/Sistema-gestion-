"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
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
  page: number;
  pageSize: number;
  total: number;
}

const columns: ColumnDef<Product>[] = [
  { key: "nombre", header: "Nombre" },
  {
    key: "codigoBarras",
    header: "Código Barras",
    render: (row) => row.codigoBarras || "-",
  },
  {
    key: "precioMinorista",
    header: "Precio Minorista",
    render: (row) => `$${row.precioMinorista.toFixed(2)}`,
  },
  {
    key: "precioMayorista",
    header: "Precio Mayorista",
    render: (row) => `$${row.precioMayorista.toFixed(2)}`,
  },
  { key: "stockActual", header: "Stock" },
];

export function ProductsTable({
  products: initialProducts,
  page,
  pageSize,
  total,
}: ProductsTableProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
    } catch {
      alert("Error al eliminar el producto");
    } finally {
      setDeletingId(null);
    }
  };

  const renderActions = (product: Product) => (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push(`/dashboard/productos/${product.id}`)}
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
  );

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Productos</h1>
        <Button onClick={() => router.push("/dashboard/productos/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Producto
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={products}
        emptyMessage="No hay productos registrados"
        actions={renderActions}
        page={page}
        pageSize={pageSize}
        total={total}
      />
    </>
  );
}
