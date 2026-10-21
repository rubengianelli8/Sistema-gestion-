"use client";

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
          <div className="min-w-0 space-y-3 text-center">
            <p className="break-words font-semibold">{product.nombre}</p>
            <p className="break-all text-sm text-muted-foreground">
              {product.codigoBarras}
            </p>
            <div className="flex max-w-full justify-center overflow-x-auto">
              <Barcode
                value={product.codigoBarras}
                height={80}
                className="h-auto max-w-full"
              />
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
      {open &&
        typeof document !== "undefined" &&
        createPortal(printSheet, document.body)}
    </>
  );
}
