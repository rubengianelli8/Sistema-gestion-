"use server";

import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supplierService } from "@/services";
import { requirePermission, Permission } from "@/lib/permissions";
import {
  supplierCreateSchema,
  supplierUpdateSchema,
  type SupplierCreateInput,
  type SupplierUpdateInput,
} from "@/lib/validations/supplier.schema";
import { revalidatePath } from "next/cache";

export async function createSupplierAction(data: SupplierCreateInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.PROVEEDORES_CREAR);

    const validated = supplierCreateSchema.parse(data);
    const supplier = await supplierService.createSupplier({
      nombre: validated.nombre,
      contacto: validated.contacto,
      email: validated.email || undefined,
      telefono: validated.telefono,
      direccion: validated.direccion,
      cuit: validated.cuit,
    });

    revalidatePath("/dashboard/proveedores");
    return { success: true, data: supplier };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function updateSupplierAction(
  id: string,
  data: Partial<SupplierUpdateInput>,
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.PROVEEDORES_EDITAR);

    const validated = supplierUpdateSchema.parse(data);
    const supplier = await supplierService.updateSupplier(parseInt(id, 10), {
      ...validated,
      email: validated.email || undefined,
    });

    revalidatePath("/dashboard/proveedores");
    return { success: true, data: supplier };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function deleteSupplierAction(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.PROVEEDORES_ELIMINAR);

    const result = await supplierService.deleteSupplier(parseInt(id, 10));

    revalidatePath("/dashboard/proveedores");
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

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

export async function getSupplierByIdAction(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.PROVEEDORES_VER);

    const supplier = await supplierService.getSupplierById(parseInt(id, 10));
    return { success: true, data: supplier };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
