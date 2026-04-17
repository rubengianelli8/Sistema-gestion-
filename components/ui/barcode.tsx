"use client";

import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";

export interface BarcodeProps {
  value: string;
  height?: number;
  displayValue?: boolean;
  className?: string;
}

export function Barcode({
  value,
  height = 40,
  displayValue = true,
  className,
}: BarcodeProps) {
  const ref = useRef<SVGSVGElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!ref.current || !value) return;
    try {
      JsBarcode(ref.current, value, {
        format: "CODE128",
        height,
        displayValue,
        margin: 0,
      });
      setError(false);
    } catch {
      setError(true);
    }
  }, [value, height, displayValue]);

  if (!value) return null;
  if (error) {
    return (
      <span className="text-xs text-muted-foreground">Código inválido</span>
    );
  }
  return <svg ref={ref} className={className} />;
}
