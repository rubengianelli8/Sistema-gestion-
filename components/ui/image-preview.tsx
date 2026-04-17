"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ImageOff } from "lucide-react";
import { getImageProxyUrl } from "@/lib/image-url";

interface ImagePreviewProps {
  url?: string | null;
  alt: string;
  thumbClassName?: string;
}

export function ImagePreview({ url, alt, thumbClassName }: ImagePreviewProps) {
  const [open, setOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!url || imageError) {
    return (
      <div className="w-12 h-12 rounded border bg-muted/20 flex items-center justify-center text-muted-foreground">
        <ImageOff className="w-4 h-4" />
      </div>
    );
  }

  const src = getImageProxyUrl(url);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        aria-label="Ver imagen ampliada"
      >
        <img
          src={src}
          alt={alt}
          className={thumbClassName ?? "w-12 h-12 object-cover rounded border"}
          loading="lazy"
          onError={() => setImageError(true)}
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen} maxWidth="max-w-3xl">
        <DialogContent className="p-4">
          <img
            src={src}
            alt={alt}
            className="w-full max-h-[80vh] object-contain rounded"
            onError={() => setImageError(true)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
