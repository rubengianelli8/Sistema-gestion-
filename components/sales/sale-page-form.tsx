"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createSaleAction,
  lookupProductByBarcodeForSaleAction,
  searchProductsForSaleAction,
  type SaleProductDto,
} from "@/app/actions/sale.actions";
import { toast } from "sonner";
import { PaymentMethod } from "@prisma/client";
import { ArrowLeft, Camera, Minus, Plus, Trash2, X } from "lucide-react";
import { ImagePreview } from "@/components/ui/image-preview";
import { BarcodeScannerDialog } from "@/components/ui/barcode-scanner-dialog";

interface Customer {
  id: number;
  nombre: string;
}

interface SaleItem {
  productoId: number;
  cantidad: number;
  productoNombre: string;
  imagenUrl?: string | null;
  precioUnitario: number;
  subtotal: number;
  stockActual: number;
}

interface SalePageFormProps {
  customers: Customer[];
}

export function SalePageForm({ customers }: SalePageFormProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clienteId, setClienteId] = useState<string>("");
  const [metodoPago, setMetodoPago] = useState<PaymentMethod>(
    PaymentMethod.EFECTIVO,
  );
  const [notas, setNotas] = useState("");
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<SaleProductDto | null>(
    null,
  );
  const [selectedQuantity, setSelectedQuantity] = useState<string>("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SaleProductDto[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [scanValue, setScanValue] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const result = await searchProductsForSaleAction(q);
        if (cancelled) return;
        if (result.success && result.data) {
          setSearchResults(result.data);
        } else {
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const addProductToCart = useCallback(
    (product: SaleProductDto, cantidad: number) => {
      if (product.stockActual <= 0) {
        toast.error(`Sin stock: ${product.nombre}`);
        return false;
      }

      let added = false;
      setItems((prev) => {
        const existing = prev.find((i) => i.productoId === product.id);
        const nextQty = (existing?.cantidad ?? 0) + cantidad;
        if (product.stockActual < nextQty) {
          toast.error(
            `Stock insuficiente. Disponible: ${product.stockActual}`,
          );
          return prev;
        }

        added = true;
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
            cantidad,
            productoNombre: product.nombre,
            imagenUrl: product.imagenUrl,
            precioUnitario: product.precio,
            subtotal: product.precio * cantidad,
            stockActual: product.stockActual,
          },
        ];
      });
      return added;
    },
    [],
  );

  const addByBarcode = useCallback(
    async (raw: string) => {
      const code = raw.trim();
      if (!code || barcodeLoading) return;

      setBarcodeLoading(true);
      try {
        const result = await lookupProductByBarcodeForSaleAction(code);
        if (!result.success || !result.data) {
          toast.error(
            result.error ?? `No se encontró un producto con código ${code}`,
          );
          return;
        }

        if (result.data.stockActual <= 0) {
          toast.error(`Sin stock: ${result.data.nombre}`);
          return;
        }

        if (addProductToCart(result.data, 1)) {
          toast.success(`Agregado: ${result.data.nombre}`);
          setError(null);
        }
      } finally {
        setBarcodeLoading(false);
      }
    },
    [addProductToCart, barcodeLoading],
  );

  const handleScannerDetected = useCallback(
    (code: string) => {
      addByBarcode(code);
    },
    [addByBarcode],
  );

  const handleAddProduct = () => {
    if (!selectedProduct) {
      setError("Debe seleccionar un producto de la búsqueda");
      return;
    }

    const cantidad = parseInt(selectedQuantity) || 1;
    if (cantidad <= 0) {
      setError("La cantidad debe ser mayor a 0");
      return;
    }

    if (addProductToCart(selectedProduct, cantidad)) {
      setSelectedProduct(null);
      setSearchQuery("");
      setSearchResults([]);
      setSelectedQuantity("1");
      setError(null);
    }
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

    if (item.stockActual < newQuantity) {
      toast.error(`Stock insuficiente. Disponible: ${item.stockActual}`);
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
                    void addByBarcode(scanValue);
                    setScanValue("");
                  }
                }}
                placeholder={
                  barcodeLoading
                    ? "Buscando producto..."
                    : "Escaneá con lector USB o escribí y Enter"
                }
                disabled={barcodeLoading}
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
                <div className="space-y-1">
                  <Label htmlFor="productSearch">Buscar por nombre o código</Label>
                  <Input
                    id="productSearch"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedProduct(null);
                    }}
                    placeholder="Mínimo 2 caracteres..."
                    className="h-10"
                    autoComplete="off"
                  />
                </div>

                {searchLoading && (
                  <p className="text-xs text-muted-foreground">Buscando...</p>
                )}

                {!searchLoading &&
                  searchQuery.trim().length >= 2 &&
                  searchResults.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Sin resultados con stock disponible.
                    </p>
                  )}

                {searchResults.length > 0 && (
                  <ul className="max-h-48 overflow-y-auto rounded-md border divide-y">
                    {searchResults.map((product) => (
                      <li key={product.id}>
                        <button
                          type="button"
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 ${
                            selectedProduct?.id === product.id
                              ? "bg-primary/10"
                              : ""
                          }`}
                          onClick={() => setSelectedProduct(product)}
                        >
                          <span className="font-medium">{product.nombre}</span>
                          <span className="text-muted-foreground">
                            {" "}
                            — Stock: {product.stockActual} — $
                            {product.precio.toFixed(2)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {selectedProduct && (
                  <div className="flex items-center gap-2 rounded-md border bg-background p-2">
                    <div className="shrink-0">
                      <ImagePreview
                        url={selectedProduct.imagenUrl}
                        alt={selectedProduct.nombre}
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-sm">
                      <p className="font-medium truncate">
                        {selectedProduct.nombre}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stock: {selectedProduct.stockActual} — $
                        {selectedProduct.precio.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

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
                    disabled={!selectedProduct}
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
