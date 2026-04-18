"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cancelPurchaseAction } from "@/app/actions/purchase.actions";
import { Ban } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PurchaseStatus } from "@prisma/client";

interface CancelPurchaseButtonProps {
  purchaseId: number;
  estado: PurchaseStatus;
  canAnular: boolean;
  variant?: "default" | "outline" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

export function CancelPurchaseButton({
  purchaseId,
  estado,
  canAnular,
  variant = "destructive",
  size = "sm",
  showLabel = false,
}: CancelPurchaseButtonProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!canAnular || estado === PurchaseStatus.CANCELADA) {
    return null;
  }

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const result = await cancelPurchaseAction(purchaseId.toString());
      if (result.success) {
        toast.success("Compra anulada correctamente");
        setConfirmOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Error al anular la compra");
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
        variant={variant}
        size={size}
        onClick={() => setConfirmOpen(true)}
        title={showLabel ? undefined : "Anular compra"}
      >
        <Ban className={showLabel ? "w-4 h-4 mr-2 shrink-0" : "w-4 h-4"} />
        {showLabel ? "Anular compra" : null}
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="¿Anular compra?"
        description="Se revertirá el stock de los productos. Esta acción no se puede deshacer."
        confirmLabel="Anular"
        loading={loading}
        onConfirm={handleConfirm}
      />
    </>
  );
}
