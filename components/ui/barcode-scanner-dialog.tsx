"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BarcodeScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetected: (code: string) => void;
}

export function BarcodeScannerDialog({
  open,
  onOpenChange,
  onDetected,
}: BarcodeScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [cameraError, setCameraError] = useState(false);

  useEffect(() => {
    if (!open) {
      setCameraError(false);
      return;
    }

    setCameraError(false);
    let cancelled = false;

    const start = async () => {
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      const video = videoRef.current;
      if (!video || cancelled) return;

      const reader = new BrowserMultiFormatReader();
      try {
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          video,
          (result, _err, c) => {
            if (cancelled || !result) return;
            cancelled = true;
            try {
              c.stop();
            } catch {
              /* ignore */
            }
            onDetected(result.getText());
            onOpenChange(false);
          },
        );
        controlsRef.current = controls;
        if (cancelled) {
          controls.stop();
        }
      } catch {
        if (!cancelled) {
          setCameraError(true);
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      try {
        controlsRef.current?.stop();
      } catch {
        /* ignore */
      }
      controlsRef.current = null;
    };
  }, [open, onDetected, onOpenChange]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="max-w-lg">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Escanear con cámara</DialogTitle>
        </DialogHeader>
        {cameraError ? (
          <p className="text-sm text-destructive">
            No se pudo acceder a la cámara. Verificá permisos.
          </p>
        ) : (
          <video
            ref={videoRef}
            className="w-full rounded-md bg-black"
            muted
            playsInline
          />
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
