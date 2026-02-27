"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteRequest = (id: number) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (pendingDeleteId === null) return;

    setDeleting(true);
    try {
      const result = await deleteProductAction(pendingDeleteId.toString());
      if (result.success) {
        setProducts(products.filter((p) => p.id !== pendingDeleteId));
        setConfirmOpen(false);
        setPendingDeleteId(null);
      } else {
        setConfirmOpen(false);
        setPendingDeleteId(null);
      }
    } catch {
      setConfirmOpen(false);
      setPendingDeleteId(null);
    } finally {
      setDeleting(false);
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
        onClick={() => handleDeleteRequest(product.id)}
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

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="¿Eliminar producto?"
        description="Esta acción no se puede deshacer. El producto será eliminado permanentemente."
        confirmLabel="Eliminar"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
