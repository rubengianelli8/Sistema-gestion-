"use server";

import { requireBusinessContext, tenantActionError } from "@/lib/tenant-context";
import { customerService } from "@/services";
import { customerCreateSchema, customerUpdateSchema, type CustomerCreateInput, type CustomerUpdateInput } from "@/lib/validations/customer.schema";
import { requirePermission, Permission } from "@/lib/permissions";

export async function createCustomerAction(data: CustomerCreateInput) {
  try {
    const context = await requireBusinessContext();

    requirePermission(context.rol, Permission.CLIENTES_CREAR);

    const validatedData = customerCreateSchema.parse(data);
    const customer = await customerService.createCustomer(
      context,
      validatedData,
    );

    return { success: true, data: customer, message: "Cliente creado exitosamente" };
  } catch (error) {
    return {
      success: false,
      error: tenantActionError(error),
    };
  }
}

export async function getAllCustomersAction() {
  try {
    const context = await requireBusinessContext();

    requirePermission(context.rol, Permission.CLIENTES_VER);

    const customers = await customerService.getAllCustomers(context);
    return { success: true, data: customers };
  } catch (error) {
    return {
      success: false,
      error: tenantActionError(error),
    };
  }
}

export async function updateCustomerAction(id: string, data: Partial<CustomerUpdateInput>) {
  try {
    const context = await requireBusinessContext();

    requirePermission(context.rol, Permission.CLIENTES_EDITAR);

    const validatedData = customerUpdateSchema.parse(data);
    const customer = await customerService.updateCustomer(
      context,
      parseInt(id),
      validatedData,
    );

    return { success: true, data: customer, message: "Cliente actualizado exitosamente" };
  } catch (error) {
    return {
      success: false,
      error: tenantActionError(error),
    };
  }
}

export async function deleteCustomerAction(id: string) {
  try {
    const context = await requireBusinessContext();

    requirePermission(context.rol, Permission.CLIENTES_ELIMINAR);

    const result = await customerService.deleteCustomer(
      context,
      parseInt(id),
    );

    return { success: true, data: result, message: "Cliente eliminado exitosamente" };
  } catch (error) {
    return {
      success: false,
      error: tenantActionError(error),
    };
  }
}

