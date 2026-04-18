"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createSaleAction } from "@/app/actions/sale.actions";
import { toast } from "sonner";
import { PaymentMethod } from "@prisma/client";
import { X, Plus, Camera } from "lucide-react";
import { ImagePreview } from "@/components/ui/image-preview";
import { BarcodeScannerDialog } from "@/components/ui/barcode-scanner-dialog";

interface SaleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Array<{ id: number; nombre: string }>;
  products: Array<{
    id: number;
    nombre: string;
    imagenUrl?: string | null;
    codigoBarras?: string | null;
    precio: number;
    stockActual: number;
  }>;
  onSuccess: () => void;
}

interface SaleItem {
  productoId: number;
  cantidad: number;
  productoNombre: string;
  imagenUrl?: string | null;
  precioUnitario: number;
  subtotal: number;
}

export function SaleForm({
  open,
  onOpenChange,
  customers,
  products,
  onSuccess,
}: SaleFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clienteId, setClienteId] = useState<string>("");
  const [metodoPago, setMetodoPago] = useState<PaymentMethod>(
    PaymentMethod.EFECTIVO,
  );
  const [notas, setNotas] = useState("");
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedQuantity, setSelectedQuantity] = useState<string>("1");
  const [scanValue, setScanValue] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setClienteId("");
      setMetodoPago(PaymentMethod.EFECTIVO);
      setNotas("");
      setItems([]);
      setSelectedProductId("");
      setSelectedQuantity("1");
      setScanValue("");
      setScannerOpen(false);
      setError(null);
    }
  }, [open]);

  const addByBarcode = useCallback(
    (raw: string) => {
      const code = raw.trim();
      if (!code) return;
      const product = products.find((p) => (p.codigoBarras ?? "") === code);
      if (!product) {
        toast.error(`No se encontró un producto con código ${code}`);
        return;
      }
      if (product.stockActual <= 0) {
        toast.error(`Sin stock: ${product.nombre}`);
        return;
      }
      setItems((prev) => {
        const existing = prev.find((i) => i.productoId === product.id);
        const nextQty = (existing?.cantidad ?? 0) + 1;
        if (product.stockActual < nextQty) {
          toast.error(`Stock insuficiente. Disponible: ${product.stockActual}`);
          return prev;
        }
        if (existing) {
          return prev.map((i) =>
            i.productoId === product.id
              ? {
                  ...i,
                  cantidad: nextQty,
                  subtotal: i.precioUnitario * nextQty,
                }
              : i,
          );
        }
        return [
          ...prev,
          {
            productoId: product.id,
            cantidad: 1,
            productoNombre: product.nombre,
            imagenUrl: product.imagenUrl,
            precioUnitario: product.precio,
            subtotal: product.precio,
          },
        ];
      });
      toast.success(`Agregado: ${product.nombre}`);
      setError(null);
    },
    [products],
  );

  const handleScannerDetected = useCallback(
    (code: string) => {
      addByBarcode(code);
    },
    [addByBarcode],
  );

  const handleAddProduct = () => {
    if (!selectedProductId) {
      setError("Debe seleccionar un producto");
      return;
    }

    const product = products.find((p) => p.id === parseInt(selectedProductId));
    if (!product) return;

    const cantidad = parseInt(selectedQuantity) || 1;
    if (cantidad <= 0) {
      setError("La cantidad debe ser mayor a 0");
      return;
    }

    if (product.stockActual < cantidad) {
      setError(`Stock insuficiente. Disponible: ${product.stockActual}`);
      return;
    }

    // Verificar si el producto ya está en la lista
    const existingItem = items.find((item) => item.productoId === product.id);
    if (existingItem) {
      const newQuantity = existingItem.cantidad + cantidad;
      if (product.stockActual < newQuantity) {
        setError(`Stock insuficiente. Disponible: ${product.stockActual}`);
        return;
      }
      setItems(
        items.map((item) =>
          item.productoId === product.id
            ? {
                ...item,
                cantidad: newQuantity,
                subtotal: product.precio * newQuantity,
              }
            : item,
        ),
      );
    } else {
      setItems([
        ...items,
        {
          productoId: product.id,
          cantidad,
          productoNombre: product.nombre,
          imagenUrl: product.imagenUrl,
          precioUnitario: product.precio,
          subtotal: product.precio * cantidad,
        },
      ]);
    }

    setSelectedProductId("");
    setSelectedQuantity("1");
    setError(null);
  };

  const handleRemoveItem = (productoId: number) => {
    setItems(items.filter((item) => item.productoId !== productoId));
  };

  const handleUpdateQuantity = (productoId: number, newQuantity: number) => {
    if (newQuantity <= 0) return;

    const item = items.find((i) => i.productoId === productoId);
    if (!item) return;

    const product = products.find((p) => p.id === productoId);
    if (!product) return;

    // Verificar stock disponible (considerando otros items del mismo producto)
    const otherItemsQuantity = items
      .filter((i) => i.productoId === productoId && i !== item)
      .reduce((sum, i) => sum + i.cantidad, 0);

    if (product.stockActual < newQuantity + otherItemsQuantity) {
      setError(
        `Stock insuficiente. Disponible: ${product.stockActual - otherItemsQuantity}`,
      );
      return;
    }

    setItems(
      items.map((item) =>
        item.productoId === productoId
          ? {
              ...item,
              cantidad: newQuantity,
              subtotal: item.precioUnitario * newQuantity,
            }
          : item,
      ),
    );
    setError(null);
  };

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  const selectedProduct = products.find((p) => p.id === Number(selectedProductId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (items.length === 0) {
      const msg = "Debe agregar al menos un producto";
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    try {
      const result = await createSaleAction({
        clienteId: clienteId ? parseInt(clienteId) : undefined,
        metodoPago,
        notas: notas || undefined,
        items: items.map((item) => ({
          productoId: item.productoId,
          cantidad: item.cantidad,
        })),
      });

      if (!result.success) {
        const msg = result.error || "Error al crear la venta";
        setError(msg);
        toast.error(msg);
        return;
      }

      toast.success("Venta creada exitosamente");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setError(msg);
      toast.error("Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const availableProducts = products.filter((p) => p.stockActual > 0);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="max-w-6xl">
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Venta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cliente">Cliente (Opcional)</Label>
              <select
                id="cliente"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
              >
                <option value="">Sin cliente</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="metodoPago">Método de Pago *</Label>
              <select
                id="metodoPago"
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value as PaymentMethod)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                required
              >
                <option value={PaymentMethod.EFECTIVO}>Efectivo</option>
                <option value={PaymentMethod.TARJETA}>Tarjeta</option>
                <option value={PaymentMethod.TRANSFERENCIA}>
                  Transferencia
                </option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="notas">Notas</Label>
            <Input
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas adicionales (opcional)"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Productos</h3>
            <div className="space-y-2 mb-4">
              <Label htmlFor="scanBarcode">Escanear código de barras</Label>
              <div className="flex flex-wrap gap-2 items-end">
                <Input
                  id="scanBarcode"
                  value={scanValue}
                  onChange={(e) => setScanValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addByBarcode(scanValue);
                      setScanValue("");
                    }
                  }}
                  placeholder="Lector USB o pegar y Enter"
                  autoComplete="off"
                  autoFocus
                  className="flex-1 min-w-[200px]"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setScannerOpen(true)}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Escanear con cámara
                </Button>
              </div>
            </div>
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="shrink-0">
                  <ImagePreview
                    url={selectedProduct?.imagenUrl}
                    alt={selectedProduct?.nombre || "Producto sin seleccionar"}
                  />
                </div>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">Seleccionar producto</option>
                  {availableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.nombre} - Stock: {product.stockActual} - $
                      {product.precio}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  min="1"
                  value={selectedQuantity}
                  onChange={(e) => setSelectedQuantity(e.target.value)}
                  placeholder="Cantidad"
                  className="w-24"
                />
                <Button type="button" onClick={handleAddProduct}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar
                </Button>
              </div>
            </div>

            {items.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Producto</th>
                      <th className="px-4 py-2 text-left">Cantidad</th>
                      <th className="px-4 py-2 text-left">Precio Unit.</th>
                      <th className="px-4 py-2 text-left">Subtotal</th>
                      <th className="px-4 py-2 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.productoId} className="border-t">
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <ImagePreview url={item.imagenUrl} alt={item.productoNombre} />
                            <span>{item.productoNombre}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={(e) =>
                              handleUpdateQuantity(
                                item.productoId,
                                parseInt(e.target.value) || 1,
                              )
                            }
                            className="w-20"
                          />
                        </td>
                        <td className="px-4 py-2">
                          ${item.precioUnitario.toFixed(2)}
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
                  <tfoot className="bg-gray-100 font-semibold">
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right">
                        Total:
                      </td>
                      <td className="px-4 py-2">${total.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || items.length === 0}>
              {loading ? "Guardando..." : "Crear Venta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <BarcodeScannerDialog
      open={scannerOpen}
      onOpenChange={setScannerOpen}
      onDetected={handleScannerDetected}
    />
    </>
  );
}
