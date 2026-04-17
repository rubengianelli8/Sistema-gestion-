"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPurchaseAction } from "@/app/actions/purchase.actions";
import { toast } from "sonner";
import { X, Plus, ArrowLeft } from "lucide-react";
import { ImagePreview } from "@/components/ui/image-preview";

interface SupplierOption {
  id: number;
  nombre: string;
}

interface ProductOption {
  id: number;
  nombre: string;
  codigoBarras?: string | null;
  imagenUrl?: string | null;
  stock: number;
}

interface PurchaseFormProps {
  suppliers: SupplierOption[];
  products: ProductOption[];
}

interface LineItem {
  productoId: number;
  productoNombre: string;
  imagenUrl?: string | null;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export function PurchaseForm({ suppliers, products }: PurchaseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proveedorId, setProveedorId] = useState<string>("");
  const [numeroFactura, setNumeroFactura] = useState("");
  const [notas, setNotas] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedQuantity, setSelectedQuantity] = useState<string>("1");
  const [selectedCost, setSelectedCost] = useState<string>("");

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.subtotal, 0),
    [items],
  );

  const handleAddProduct = () => {
    if (!proveedorId) {
      setError("Seleccione un proveedor primero");
      return;
    }
    if (!selectedProductId) {
      setError("Seleccione un producto");
      return;
    }

    const product = products.find((p) => p.id === parseInt(selectedProductId, 10));
    if (!product) return;

    const cantidad = parseInt(selectedQuantity, 10) || 0;
    if (cantidad <= 0) {
      setError("La cantidad debe ser mayor a 0");
      return;
    }

    const cost = parseFloat(selectedCost.replace(",", "."));
    if (Number.isNaN(cost) || cost < 0) {
      setError("Ingrese un costo unitario válido");
      return;
    }

    const existing = items.find((i) => i.productoId === product.id);
    if (existing) {
      const newQty = existing.cantidad + cantidad;
      setItems(
        items.map((i) =>
          i.productoId === product.id
            ? {
                ...i,
                cantidad: newQty,
                precioUnitario: cost,
                subtotal: cost * newQty,
              }
            : i,
        ),
      );
    } else {
      setItems([
        ...items,
        {
          productoId: product.id,
          productoNombre: product.nombre,
          imagenUrl: product.imagenUrl,
          cantidad,
          precioUnitario: cost,
          subtotal: cost * cantidad,
        },
      ]);
    }

    setSelectedProductId("");
    setSelectedQuantity("1");
    setSelectedCost("");
    setError(null);
  };

  const handleRemoveItem = (productoId: number) => {
    setItems(items.filter((i) => i.productoId !== productoId));
  };

  const handleUpdateQuantity = (productoId: number, newQuantity: number) => {
    if (newQuantity <= 0) return;
    setItems(
      items.map((i) =>
        i.productoId === productoId
          ? {
              ...i,
              cantidad: newQuantity,
              subtotal: i.precioUnitario * newQuantity,
            }
          : i,
      ),
    );
    setError(null);
  };

  const handleUpdateCost = (productoId: number, value: string) => {
    const cost = parseFloat(value.replace(",", "."));
    if (Number.isNaN(cost) || cost < 0) return;
    setItems(
      items.map((i) =>
        i.productoId === productoId
          ? {
              ...i,
              precioUnitario: cost,
              subtotal: cost * i.cantidad,
            }
          : i,
      ),
    );
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!proveedorId) {
      setError("Seleccione un proveedor");
      toast.error("Seleccione un proveedor");
      setLoading(false);
      return;
    }

    if (items.length === 0) {
      const msg = "Agregue al menos un producto";
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    try {
      const result = await createPurchaseAction({
        proveedorId: parseInt(proveedorId, 10),
        numeroFactura: numeroFactura.trim() || undefined,
        notas: notas.trim() || undefined,
        items: items.map((i) => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
        })),
      });

      if (!result.success) {
        const msg = result.error || "Error al registrar la compra";
        setError(msg);
        toast.error(msg);
        return;
      }

      toast.success("Compra registrada correctamente");
      router.push("/dashboard/productos");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(
    (p) => p.id === Number(selectedProductId),
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/productos")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a productos
        </Button>
        <h1 className="text-2xl font-bold">Nueva compra</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="proveedor">Proveedor *</Label>
            <select
              id="proveedor"
              value={proveedorId}
              onChange={(e) => setProveedorId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              required
            >
              <option value="">Seleccionar proveedor</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="numeroFactura">Número de factura</Label>
            <Input
              id="numeroFactura"
              value={numeroFactura}
              onChange={(e) => setNumeroFactura(e.target.value)}
              placeholder="Opcional"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="notas">Notas</Label>
          <Input
            id="notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Observaciones (opcional)"
          />
        </div>

        <div className="border-t pt-4">
          <h2 className="font-semibold mb-3">Productos</h2>
          <div className="flex flex-wrap gap-3 items-end mb-4">
            <div className="shrink-0">
              <ImagePreview
                url={selectedProduct?.imagenUrl}
                alt={selectedProduct?.nombre || "Producto"}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label>Producto</Label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="">Seleccionar</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                    {p.codigoBarras ? ` — ${p.codigoBarras}` : ""} (stock:{" "}
                    {p.stock})
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <Label>Cantidad</Label>
              <Input
                type="number"
                min={1}
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(e.target.value)}
              />
            </div>
            <div className="w-32">
              <Label>Costo unit.</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={selectedCost}
                onChange={(e) => setSelectedCost(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <Button type="button" onClick={handleAddProduct}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar
            </Button>
          </div>

          {items.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left">Producto</th>
                    <th className="px-4 py-2 text-left">Cantidad</th>
                    <th className="px-4 py-2 text-left">Costo unit.</th>
                    <th className="px-4 py-2 text-left">Subtotal</th>
                    <th className="px-4 py-2 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.productoId} className="border-t">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <ImagePreview
                            url={item.imagenUrl}
                            alt={item.productoNombre}
                          />
                          <span>{item.productoNombre}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          min={1}
                          className="w-20"
                          value={item.cantidad}
                          onChange={(e) =>
                            handleUpdateQuantity(
                              item.productoId,
                              parseInt(e.target.value, 10) || 1,
                            )
                          }
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="text"
                          inputMode="decimal"
                          className="w-28"
                          value={String(item.precioUnitario)}
                          onChange={(e) =>
                            handleUpdateCost(item.productoId, e.target.value)
                          }
                        />
                      </td>
                      <td className="px-4 py-2">
                        ${item.subtotal.toFixed(2)}
                      </td>
                      <td className="px-4 py-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveItem(item.productoId)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/50 font-semibold">
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right">
                      Total:
                    </td>
                    <td className="px-4 py-2">${total.toFixed(2)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/productos")}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading || items.length === 0}>
            {loading ? "Guardando..." : "Registrar compra"}
          </Button>
        </div>
      </form>
    </div>
  );
}
