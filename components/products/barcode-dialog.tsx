"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Barcode } from "@/components/ui/barcode";

export interface BarcodeDialogProduct {
  nombre: string;
  codigoBarras: string;
}

interface BarcodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: BarcodeDialogProduct | null;
}

export function BarcodeDialog({
  open,
  onOpenChange,
  product,
}: BarcodeDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!product) return null;

  const printSheet = (
    <div className="print-area print-sheet text-center space-y-3">
      <p className="font-semibold">{product.nombre}</p>
      <p className="text-sm text-muted-foreground">{product.codigoBarras}</p>
      <div className="flex justify-center">
        <Barcode value={product.codigoBarras} height={80} />
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange} maxWidth="max-w-md">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Código de barras</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-3">
            <p className="font-semibold">{product.nombre}</p>
            <p className="text-sm text-muted-foreground">
              {product.codigoBarras}
            </p>
            <div className="flex justify-center">
              <Barcode value={product.codigoBarras} height={80} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            <Button type="button" onClick={() => window.print()}>
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {mounted && open && createPortal(printSheet, document.body)}
    </>
  );
}
