"use server";

import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supplierService } from "@/services";
import { requirePermission, Permission } from "@/lib/permissions";

export async function getAllSuppliersAction() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.PROVEEDORES_VER);

    const suppliers = await supplierService.getAllSuppliers();
    return { success: true, data: suppliers };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
