"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteProductAction } from "@/app/actions/product.actions";
import { Pencil, Trash2, Plus, Barcode, Printer, Search, ShoppingCart } from "lucide-react";
import { Barcode as BarcodeSvg } from "@/components/ui/barcode";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { ImagePreview } from "@/components/ui/image-preview";
import { BarcodeDialog } from "@/components/products/barcode-dialog";
import { BarcodeSheetDialog } from "@/components/products/barcode-sheet-dialog";
import { toast } from "sonner";

interface Product {
  id: number;
  nombre: string;
  imagenUrl?: string | null;
  codigoBarras?: string | null;
  precio?: number | null;
  stockActual?: number | null;
  stock?: number | null;
}

interface ProductsTableProps {
  products: Product[];
  page: number;
  pageSize: number;
  total: number;
  initialQuery?: string;
  /** Si el usuario puede registrar compras (COMPRAS_CREAR) */
  canCreatePurchase?: boolean;
}

export function ProductsTable({
  products: initialProducts,
  page,
  pageSize,
  total,
  initialQuery = "",
  canCreatePurchase = false,
}: ProductsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState(initialProducts);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState<{
    nombre: string;
    codigoBarras: string;
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const urlQ = searchParams.get("q") ?? "";
      if (query === urlQ) return;
      setSelectedIds(new Set());
      const params = new URLSearchParams(searchParams.toString());
      if (query) params.set("q", query);
      else params.delete("q");
      params.set("page", "1");
      params.set("pageSize", String(pageSize));
      router.replace(`${pathname}?${params.toString()}`);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, pathname, router, searchParams, pageSize]);

  const selectableIds = useMemo(
    () => products.filter((p) => p.codigoBarras).map((p) => p.id),
    [products],
  );

  const allSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selectedIds.has(id));

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const everySelected =
        selectableIds.length > 0 &&
        selectableIds.every((id) => next.has(id));
      if (everySelected) {
        selectableIds.forEach((id) => next.delete(id));
      } else {
        selectableIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [selectableIds]);

  const toggleOne = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const bulkPrintItems = useMemo(
    () =>
      products
        .filter((p) => selectedIds.has(p.id) && p.codigoBarras)
        .map((p) => ({
          nombre: p.nombre,
          codigoBarras: p.codigoBarras as string,
        })),
    [products, selectedIds],
  );

  const columns: ColumnDef<Product>[] = useMemo(
    () => [
      {
        key: "_select",
        header: "",
        headerRender: () => (
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            aria-label="Seleccionar todos"
            className="cursor-pointer"
          />
        ),
        render: (row) =>
          row.codigoBarras ? (
            <input
              type="checkbox"
              checked={selectedIds.has(row.id)}
              onChange={() => toggleOne(row.id)}
              aria-label={`Seleccionar ${row.nombre}`}
              className="cursor-pointer"
            />
          ) : null,
      },
      {
        key: "imagenUrl",
        header: "Imagen",
        render: (row) => (
          <ImagePreview url={row.imagenUrl} alt={row.nombre} />
        ),
      },
      { key: "nombre", header: "Nombre" },
      {
        key: "codigoBarras",
        header: "Código Barras",
        render: (row) =>
          row.codigoBarras ? (
            <div className="flex flex-col gap-1 items-start">
              <span className="text-sm">{row.codigoBarras}</span>
              <BarcodeSvg
                value={row.codigoBarras}
                height={28}
                displayValue={false}
                className="max-w-[140px]"
              />
            </div>
          ) : (
            "-"
          ),
      },
      {
        key: "precio",
        header: "Precio",
        render: (row) =>
          typeof row.precio === "number"
            ? `$${row.precio.toFixed(2)}`
            : "-",
      },
      {
        key: "stockActual",
        header: "Stock",
        render: (row) => row.stockActual ?? row.stock ?? "-",
      },
    ],
    [allSelected, selectedIds, toggleAll, toggleOne],
  );

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
        toast.success("Producto eliminado exitosamente");
        setProducts(products.filter((p) => p.id !== pendingDeleteId));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(pendingDeleteId);
          return next;
        });
        setConfirmOpen(false);
        setPendingDeleteId(null);
      } else {
        toast.error(result.error || "Error al eliminar el producto");
        setConfirmOpen(false);
        setPendingDeleteId(null);
      }
    } catch {
      toast.error("Error inesperado");
      setConfirmOpen(false);
      setPendingDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  const renderActions = (product: Product) => (
    <div className="flex gap-2">
      {product.codigoBarras ? (
        <Button
          variant="outline"
          size="sm"
          type="button"
          title="Ver código de barras"
          onClick={() => {
            const code = product.codigoBarras;
            if (!code) return;
            setBarcodeProduct({ nombre: product.nombre, codigoBarras: code });
          }}
        >
          <Barcode className="w-4 h-4" />
        </Button>
      ) : null}
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
      <div className="mb-4 flex flex-wrap justify-between items-center gap-2">
        <h1 className="text-2xl font-bold">Productos</h1>
        <div className="flex flex-wrap gap-2">
          {canCreatePurchase ? (
            <Button
              variant="outline"
              type="button"
              onClick={() => router.push("/dashboard/compras/new")}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Nueva compra
            </Button>
          ) : null}
          <Button
            variant="outline"
            type="button"
            disabled={bulkPrintItems.length === 0}
            onClick={() => setSheetOpen(true)}
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir etiquetas ({bulkPrintItems.length})
          </Button>
          <Button onClick={() => router.push("/dashboard/productos/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Producto
          </Button>
        </div>
      </div>

      <div className="mb-3 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o código de barras..."
          className="pl-9"
        />
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

      <BarcodeDialog
        open={!!barcodeProduct}
        onOpenChange={(o) => {
          if (!o) setBarcodeProduct(null);
        }}
        product={barcodeProduct}
      />

      <BarcodeSheetDialog
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        items={bulkPrintItems}
      />
    </>
  );
}
