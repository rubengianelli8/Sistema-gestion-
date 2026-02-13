"use server";

import { auth } from "@/app/api/auth/[...nextauth]/route";
import { categoryService } from "@/services";
import { categoryCreateSchema, categoryUpdateSchema, type CategoryCreateInput, type CategoryUpdateInput } from "@/lib/validations/category.schema";
import { requirePermission, Permission } from "@/lib/permissions";

export async function createCategoryAction(data: CategoryCreateInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.PRODUCTOS_CREAR);

    const validatedData = categoryCreateSchema.parse(data);
    const category = await categoryService.createCategory(
      validatedData,
      session.user.id,
      session.user.name
    );

    return { success: true, data: category, message: "Categoría creada exitosamente" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function getAllCategoriesAction() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.PRODUCTOS_VER);

    const categories = await categoryService.getAllCategories();
    return { success: true, data: categories };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function updateCategoryAction(id: string, data: Partial<CategoryUpdateInput>) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.PRODUCTOS_EDITAR);

    const validatedData = categoryUpdateSchema.parse(data);
    const category = await categoryService.updateCategory(
      id,
      validatedData,
      session.user.id,
      session.user.name
    );

    return { success: true, data: category, message: "Categoría actualizada exitosamente" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.PRODUCTOS_ELIMINAR);

    const result = await categoryService.deleteCategory(
      id,
      session.user.id,
      session.user.name
    );

    return { success: true, data: result, message: "Categoría eliminada exitosamente" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

