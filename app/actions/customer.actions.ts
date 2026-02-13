"use server";

import { auth } from "@/app/api/auth/[...nextauth]/route";
import { customerService } from "@/services";
import { customerCreateSchema, customerUpdateSchema, type CustomerCreateInput, type CustomerUpdateInput } from "@/lib/validations/customer.schema";
import { requirePermission, Permission } from "@/lib/permissions";

export async function createCustomerAction(data: CustomerCreateInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.CLIENTES_CREAR);

    const validatedData = customerCreateSchema.parse(data);
    const customer = await customerService.createCustomer(
      validatedData,
      parseInt(session.user.id),
      session.user.name
    );

    return { success: true, data: customer, message: "Cliente creado exitosamente" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function getAllCustomersAction() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.CLIENTES_VER);

    const customers = await customerService.getAllCustomers();
    return { success: true, data: customers };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function updateCustomerAction(id: string, data: Partial<CustomerUpdateInput>) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.CLIENTES_EDITAR);

    const validatedData = customerUpdateSchema.parse(data);
    const customer = await customerService.updateCustomer(
      parseInt(id),
      validatedData,
      parseInt(session.user.id),
      session.user.name
    );

    return { success: true, data: customer, message: "Cliente actualizado exitosamente" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function deleteCustomerAction(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.CLIENTES_ELIMINAR);

    const result = await customerService.deleteCustomer(
      parseInt(id),
      parseInt(session.user.id),
      session.user.name
    );

    return { success: true, data: result, message: "Cliente eliminado exitosamente" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

