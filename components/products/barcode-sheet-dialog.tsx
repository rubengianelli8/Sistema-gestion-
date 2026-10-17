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

export interface BarcodeSheetItem {
  nombre: string;
  codigoBarras: string;
}

interface BarcodeSheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: BarcodeSheetItem[];
}

export function BarcodeSheetDialog({
  open,
  onOpenChange,
  items,
}: BarcodeSheetDialogProps) {
  const printSheet = (
    <div className="print-area print-sheet">
      <div className="barcode-grid">
        {items.map((it, i) => (
          <div
            key={`${it.codigoBarras}-${i}`}
            className="barcode-cell border border-border rounded-md p-4 text-center space-y-2"
          >
            <p className="font-semibold text-sm leading-tight">{it.nombre}</p>
            <div className="flex justify-center">
              <Barcode value={it.codigoBarras} height={60} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange} maxWidth="max-w-3xl">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Imprimir etiquetas ({items.length})</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((it, i) => (
              <div
                key={`${it.codigoBarras}-${i}`}
                className="border border-border rounded-md p-4 text-center space-y-2"
              >
                <p className="break-words font-semibold text-sm leading-tight">{it.nombre}</p>
                <div className="flex max-w-full justify-center overflow-x-auto">
                  <Barcode
                    value={it.codigoBarras}
                    height={60}
                    className="h-auto max-w-full"
                  />
                </div>
              </div>
            ))}
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
