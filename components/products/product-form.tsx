"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { createProductAction, updateProductAction } from "@/app/actions/product.actions";
import { ProductCreateInput } from "@/lib/validations/product.schema";

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: {
    id: number;
    nombre: string;
    codigoBarras?: string | null;
    precioMinorista: number;
    precioMayorista: number;
  } | null;
  onSuccess: () => void;
}

export function ProductForm({ open, onOpenChange, product, onSuccess }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    codigoBarras: "",
    precioMinorista: "",
    precioMayorista: "",
  });

  useEffect(() => {
    if (product) {
      setFormData({
        nombre: product.nombre,
        codigoBarras: product.codigoBarras || "",
        precioMinorista: product.precioMinorista.toString(),
        precioMayorista: product.precioMayorista.toString(),
      });
    } else {
      setFormData({
        nombre: "",
        codigoBarras: "",
        precioMinorista: "",
        precioMayorista: "",
      });
    }
    setError(null);
  }, [product, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data: ProductCreateInput = {
        nombre: formData.nombre,
        codigoBarras: formData.codigoBarras || undefined,
        precioMinorista: parseFloat(formData.precioMinorista),
        precioMayorista: parseFloat(formData.precioMayorista),
        stockActual: 0,
        stockMinimo: 0,
      };

      if (product) {
        const result = await updateProductAction(product.id.toString(), data);
        if (!result.success) {
          setError(result.error || "Error al actualizar el producto");
          return;
        }
      } else {
        const result = await createProductAction(data);
        if (!result.success) {
          setError(result.error || "Error al crear el producto");
          return;
        }
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product ? "Editar Producto" : "Agregar Producto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div>
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              placeholder="Nombre del producto"
            />
          </div>

          <div>
            <Label htmlFor="codigoBarras">Código de Barras</Label>
            <Input
              id="codigoBarras"
              value={formData.codigoBarras}
              onChange={(e) => setFormData({ ...formData, codigoBarras: e.target.value })}
              placeholder="Código de barras (opcional)"
            />
          </div>

          <div>
            <Label htmlFor="precioMinorista">Precio Minorista *</Label>
            <Input
              id="precioMinorista"
              type="number"
              step="0.01"
              min="0"
              value={formData.precioMinorista}
              onChange={(e) => setFormData({ ...formData, precioMinorista: e.target.value })}
              required
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="precioMayorista">Precio Mayorista *</Label>
            <Input
              id="precioMayorista"
              type="number"
              step="0.01"
              min="0"
              value={formData.precioMayorista}
              onChange={(e) => setFormData({ ...formData, precioMayorista: e.target.value })}
              required
              placeholder="0.00"
            />
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
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : product ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

