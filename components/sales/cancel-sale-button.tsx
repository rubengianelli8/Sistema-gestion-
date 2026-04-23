"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cancelSaleAction } from "@/app/actions/sale.actions";
import { Ban } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SaleStatus } from "@prisma/client";

interface CancelSaleButtonProps {
  saleId: number;
  estado: SaleStatus;
  canAnular: boolean;
}

export function CancelSaleButton({
  saleId,
  estado,
  canAnular,
}: CancelSaleButtonProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!canAnular || estado === SaleStatus.ANULADA) {
    return null;
  }

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const result = await cancelSaleAction(saleId);
      if (result.success) {
        toast.success("Venta anulada correctamente");
        setConfirmOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Error al anular la venta");
      }
    } catch {
      toast.error("Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => setConfirmOpen(true)}
        title="Anular venta"
      >
        <Ban className="w-4 h-4" />
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="¿Anular venta?"
        description="Se devolverá el stock de los productos al inventario. La venta quedará marcada como ANULADA."
        confirmLabel="Anular"
        loading={loading}
        onConfirm={handleConfirm}
      />
    </>
  );
}
