"use server";

import { auth } from "@/app/api/auth/[...nextauth]/route";
import { purchaseService, productService } from "@/services";
import { requirePermission, Permission } from "@/lib/permissions";
import {
  purchaseCreateSchema,
  type PurchaseCreateInput,
} from "@/lib/validations/purchase.schema";
import { revalidatePath } from "next/cache";

export async function createPurchaseAction(data: PurchaseCreateInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.COMPRAS_CREAR);

    const branchId = session.user.branchId;
    if (!branchId) {
      return { success: false, error: "No se encontró la sucursal del usuario" };
    }

    const parsed = purchaseCreateSchema.parse(data);
    const purchase = await purchaseService.createPurchase(
      parsed,
      parseInt(session.user.id, 10),
      branchId,
    );

    revalidatePath("/dashboard/productos");
    revalidatePath("/dashboard/compras");

    return { success: true, data: purchase };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function getProductsForPurchaseAction() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.COMPRAS_CREAR);

    const branchId = session.user.branchId;
    if (!branchId) {
      return { success: false, error: "No se encontró la sucursal del usuario" };
    }

    const products = await productService.getAllProducts();
    const filtered = products.filter((p) => p.branchId === branchId);
    const data = filtered.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      codigoBarras: p.codigoBarras,
      imagenUrl: p.imagenUrl,
      stock: p.stock,
    }));

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
