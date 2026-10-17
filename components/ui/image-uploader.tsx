"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImagePreview } from "@/components/ui/image-preview";
import { Camera, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

interface ImageUploaderProps {
  value?: string | null;
  onChange: (url: string | null) => void;
}

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "No se pudo subir la imagen");
      }

      onChange(result.url);
      toast.success("Imagen subida correctamente");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al subir imagen");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex min-w-0 flex-col items-start gap-3 min-[360px]:flex-row">
        <ImagePreview
          url={value}
          alt="Imagen del producto"
          thumbClassName="w-16 h-16 object-cover rounded border"
        />
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Subir archivo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading}
            >
              <Camera className="w-4 h-4 mr-2" />
              Tomar foto
            </Button>
            {value && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange(null)}
                disabled={uploading}
              >
                <X className="w-4 h-4 mr-2" />
                Quitar
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            JPG, PNG o WEBP. Tamaño máximo: 5MB.
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={uploadImage}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={uploadImage}
      />
    </div>
  );
}
