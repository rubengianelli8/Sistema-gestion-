"use server";

import { auth } from "@/app/api/auth/[...nextauth]/route";
import { productService } from "@/services";
import { productCreateSchema, productUpdateSchema, type ProductCreateInput, type ProductUpdateInput } from "@/lib/validations/product.schema";
import { requirePermission, Permission } from "@/lib/permissions";

export async function createProductAction(data: ProductCreateInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.PRODUCTOS_CREAR);

    const validatedData = productCreateSchema.parse(data);
    const product = await productService.createProduct(
      validatedData,
      session.user.id,
      session.user.name
    );

    return { success: true, data: product, message: "Producto creado exitosamente" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function getAllProductsAction() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.PRODUCTOS_VER);

    const products = await productService.getAllProducts();
    return { success: true, data: products };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function searchProductsAction(query: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.PRODUCTOS_VER);

    const products = await productService.searchProducts(query);
    return { success: true, data: products };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function updateProductAction(id: string, data: Partial<ProductUpdateInput>) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.PRODUCTOS_EDITAR);

    const validatedData = productUpdateSchema.parse(data);
    const product = await productService.updateProduct(
      id,
      validatedData,
      session.user.id,
      session.user.name
    );

    return { success: true, data: product, message: "Producto actualizado exitosamente" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function deleteProductAction(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.PRODUCTOS_ELIMINAR);

    const result = await productService.deleteProduct(
      id,
      session.user.id,
      session.user.name
    );

    return { success: true, data: result, message: "Producto eliminado exitosamente" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

