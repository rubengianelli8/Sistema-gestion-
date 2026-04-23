"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSaleAction } from "@/app/actions/sale.actions";
import { toast } from "sonner";
import { PaymentMethod } from "@prisma/client";
import { ArrowLeft, Camera, Minus, Plus, Trash2, X } from "lucide-react";
import { ImagePreview } from "@/components/ui/image-preview";
import { BarcodeScannerDialog } from "@/components/ui/barcode-scanner-dialog";

interface Customer {
  id: number;
  nombre: string;
}

interface Product {
  id: number;
  nombre: string;
  imagenUrl?: string | null;
  codigoBarras?: string | null;
  precio: number;
  stockActual: number;
}

interface SaleItem {
  productoId: number;
  cantidad: number;
  productoNombre: string;
  imagenUrl?: string | null;
  precioUnitario: number;
  subtotal: number;
}

interface SalePageFormProps {
  customers: Customer[];
  products: Product[];
}

export function SalePageForm({ customers, products }: SalePageFormProps) {
  const router = useRouter();

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
          toast.error(
            `Stock insuficiente. Disponible: ${product.stockActual}`,
          );
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
    if (newQuantity <= 0) {
      handleRemoveItem(productoId);
      return;
    }

    const item = items.find((i) => i.productoId === productoId);
    if (!item) return;

    const product = products.find((p) => p.id === productoId);
    if (!product) return;

    if (product.stockActual < newQuantity) {
      toast.error(`Stock insuficiente. Disponible: ${product.stockActual}`);
      return;
    }

    setItems(
      items.map((current) =>
        current.productoId === productoId
          ? {
              ...current,
              cantidad: newQuantity,
              subtotal: current.precioUnitario * newQuantity,
            }
          : current,
      ),
    );
    setError(null);
  };

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  const selectedProduct = products.find(
    (p) => p.id === Number(selectedProductId),
  );
  const availableProducts = products.filter((p) => p.stockActual > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      const msg = "Debe agregar al menos un producto";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    setError(null);

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
      router.push("/dashboard/ventas");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setError(msg);
      toast.error("Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <div className="sticky top-0 z-20 bg-background border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/ventas")}
            >
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
            <h1 className="text-lg font-semibold truncate">Nueva venta</h1>
          </div>
          <div className="hidden md:block text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"} -{" "}
            <span className="font-semibold text-foreground">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <form
        id="saleForm"
        onSubmit={handleSubmit}
        className="flex-1 w-full max-w-6xl mx-auto px-4 py-4 pb-32 md:pb-6 space-y-4"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Cliente y pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="cliente">Cliente (opcional)</Label>
              <select
                id="cliente"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
              >
                <option value="">Sin cliente</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="metodoPago">Método de pago *</Label>
              <select
                id="metodoPago"
                value={metodoPago}
                onChange={(e) =>
                  setMetodoPago(e.target.value as PaymentMethod)
                }
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
                required
              >
                <option value={PaymentMethod.EFECTIVO}>Efectivo</option>
                <option value={PaymentMethod.TARJETA}>Tarjeta</option>
                <option value={PaymentMethod.TRANSFERENCIA}>
                  Transferencia
                </option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="notas">Notas</Label>
              <Input
                id="notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Notas adicionales (opcional)"
                className="h-10"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <Card className="min-w-0">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Agregar productos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="scanBarcode">Código de barras</Label>
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
                placeholder="Escaneá con lector USB o escribí y Enter"
                autoComplete="off"
                autoFocus
                className="h-11 text-base"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={() => setScannerOpen(true)}
            >
              <Camera className="w-4 h-4 mr-2" />
              Escanear con cámara
            </Button>

            <details className="group rounded-md border bg-muted/20">
              <summary className="cursor-pointer px-3 py-2 text-sm text-muted-foreground select-none">
                Buscar producto manualmente
              </summary>
              <div className="px-3 pb-3 pt-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="shrink-0">
                    <ImagePreview
                      url={selectedProduct?.imagenUrl}
                      alt={
                        selectedProduct?.nombre || "Producto sin seleccionar"
                      }
                    />
                  </div>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="flex-1 min-w-0 h-10 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
                  >
                    <option value="">Seleccionar producto</option>
                    {availableProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.nombre} - Stock: {product.stockActual} - $
                        {product.precio}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(e.target.value)}
                    placeholder="Cantidad"
                    className="w-24 h-10"
                  />
                  <Button
                    type="button"
                    onClick={handleAddProduct}
                    className="h-10 flex-1 sm:flex-none"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>
            </details>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="py-3 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm">
              Carrito ({items.length})
            </CardTitle>
            {items.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setItems([])}
              >
                <Trash2 className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Vaciar</span>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Agregá productos escaneando o desde el buscador manual.
              </p>
            ) : (
              <>
                <div className="space-y-2 md:hidden">
                  {items.map((item) => (
                    <div
                      key={item.productoId}
                      className="rounded-lg border bg-background p-3 flex gap-3 items-start"
                    >
                      <div className="shrink-0">
                        <ImagePreview
                          url={item.imagenUrl}
                          alt={item.productoNombre}
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm leading-tight">
                            {item.productoNombre}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveItem(item.productoId)}
                            aria-label="Quitar"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ${item.precioUnitario.toFixed(2)} c/u
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 w-9 p-0"
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.productoId,
                                  item.cantidad - 1,
                                )
                              }
                              aria-label="Restar"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
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
                              className="w-14 h-9 text-center"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 w-9 p-0"
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.productoId,
                                  item.cantidad + 1,
                                )
                              }
                              aria-label="Sumar"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <span className="font-semibold">
                            ${item.subtotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block rounded-lg border overflow-hidden">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">
                          Producto
                        </th>
                        <th className="px-3 py-2 text-left font-medium w-40">
                          Cantidad
                        </th>
                        <th className="px-3 py-2 text-right font-medium w-28">
                          Precio
                        </th>
                        <th className="px-3 py-2 text-right font-medium w-28">
                          Subtotal
                        </th>
                        <th className="px-3 py-2 w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr
                          key={item.productoId}
                          className="border-t align-middle"
                        >
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <ImagePreview
                                url={item.imagenUrl}
                                alt={item.productoNombre}
                              />
                              <span>{item.productoNombre}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item.productoId,
                                    item.cantidad - 1,
                                  )
                                }
                                aria-label="Restar"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
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
                                className="w-16 h-8 text-center"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item.productoId,
                                    item.cantidad + 1,
                                  )
                                }
                                aria-label="Sumar"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right">
                            ${item.precioUnitario.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            ${item.subtotal.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRemoveItem(item.productoId)}
                              aria-label="Quitar"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/40 font-semibold">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-right">
                          Total
                        </td>
                        <td className="px-3 py-2 text-right">
                          ${total.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        </div>
      </form>

      <div className="sticky bottom-0 z-20 bg-background border-t">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">
              Total ({items.length} {items.length === 1 ? "item" : "items"})
            </p>
            <p className="text-2xl font-bold leading-tight">
              ${total.toFixed(2)}
            </p>
          </div>
          <Button
            type="submit"
            form="saleForm"
            disabled={loading || items.length === 0}
            className="h-12 px-6 text-base"
          >
            {loading ? "Guardando..." : "Cobrar"}
          </Button>
        </div>
      </div>

      <BarcodeScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onDetected={handleScannerDetected}
      />
    </div>
  );
}
