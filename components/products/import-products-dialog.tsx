"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet } from "lucide-react";
import { importProductsAction } from "@/app/actions/product.actions";

interface ImportProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ImportProductsDialog({ open, onOpenChange, onSuccess }: ImportProductsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Leer el archivo como ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Convertir a base64 para enviarlo al servidor
      const bytes = new Uint8Array(arrayBuffer);
      const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), "");
      const base64 = btoa(binary);

      const result = await importProductsAction(base64, file.name);

      if (result.success) {
        setSuccess(`Se importaron ${result.data?.imported || 0} productos exitosamente. ${result.data?.errors?.length ? `Errores: ${result.data.errors.length}` : ""}`);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setTimeout(() => {
          onSuccess();
          onOpenChange(false);
          setSuccess(null);
        }, 2000);
      } else {
        setError(result.error || "Error al importar productos");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el archivo");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Crear un template Excel básico
    const template = [
      ["Nombre", "Código de Barras", "Precio Minorista", "Precio Mayorista"],
      ["Producto Ejemplo 1", "1234567890123", "100.00", "80.00"],
      ["Producto Ejemplo 2", "1234567890124", "200.00", "160.00"],
    ];

    // Convertir a CSV para descargar
    const csv = template.map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_productos.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Productos desde Excel</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <div>
            <Label htmlFor="excel-file">Seleccionar archivo Excel (.xlsx, .xls, .csv)</Label>
            <div className="mt-2">
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                ref={fileInputRef}
                disabled={loading}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              El archivo debe tener las columnas: Nombre, Código de Barras, Precio Minorista, Precio Mayorista
            </p>
          </div>

          <div className="border-t pt-4">
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="w-full"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Descargar Plantilla
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setError(null);
              setSuccess(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
            disabled={loading}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

