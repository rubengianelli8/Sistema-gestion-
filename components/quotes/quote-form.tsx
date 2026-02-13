"use client";

import { useState, useEffect } from "react";
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
import { createQuoteAction } from "@/app/actions/quote.actions";
import { X, Plus } from "lucide-react";

interface QuoteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Array<{ id: number; nombre: string }>;
  products: Array<{
    id: number;
    nombre: string;
    precioMinorista: number;
  }>;
  onSuccess: () => void;
}

interface QuoteItem {
  productoId: number;
  cantidad: number;
  productoNombre: string;
  precioUnitario: number;
  subtotal: number;
}

export function QuoteForm({
  open,
  onOpenChange,
  customers,
  products,
  onSuccess,
}: QuoteFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clienteId, setClienteId] = useState<string>("");
  const [validezDias, setValidezDias] = useState<string>("15");
  const [notas, setNotas] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedQuantity, setSelectedQuantity] = useState<string>("1");

  useEffect(() => {
    if (!open) {
      setClienteId("");
      setValidezDias("15");
      setNotas("");
      setItems([]);
      setSelectedProductId("");
      setSelectedQuantity("1");
      setError(null);
    }
  }, [open]);

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

    // Verificar si el producto ya está en la lista
    const existingItem = items.find((item) => item.productoId === product.id);
    if (existingItem) {
      const newQuantity = existingItem.cantidad + cantidad;
      setItems(
        items.map((item) =>
          item.productoId === product.id
            ? {
                ...item,
                cantidad: newQuantity,
                subtotal: product.precioMinorista * newQuantity,
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
          precioUnitario: product.precioMinorista,
          subtotal: product.precioMinorista * cantidad,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!clienteId) {
      setError("Debe seleccionar un cliente");
      setLoading(false);
      return;
    }

    if (items.length === 0) {
      setError("Debe agregar al menos un producto");
      setLoading(false);
      return;
    }

    try {
      const result = await createQuoteAction({
        clienteId: parseInt(clienteId),
        validezDias: parseInt(validezDias) || 15,
        notas: notas || undefined,
        items: items.map((item) => ({
          productoId: item.productoId,
          cantidad: item.cantidad,
        })),
      });

      if (!result.success) {
        setError(result.error || "Error al crear el presupuesto");
        return;
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="max-w-6xl">
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Presupuesto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cliente">Cliente *</Label>
              <select
                id="cliente"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                required
              >
                <option value="">Seleccionar cliente</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="validezDias">Validez (días) *</Label>
              <Input
                id="validezDias"
                type="number"
                min="1"
                max="365"
                value={validezDias}
                onChange={(e) => setValidezDias(e.target.value)}
                required
                placeholder="15"
              />
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
            <div className="flex gap-2 mb-4">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Seleccionar producto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.nombre} - ${product.precioMinorista}
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
                        <td className="px-4 py-2">{item.productoNombre}</td>
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
              {loading ? "Guardando..." : "Crear Presupuesto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

