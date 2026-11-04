"use server";

import { requireBusinessContext, tenantActionError } from "@/lib/tenant-context";
import { categoryService } from "@/services";
import { categoryCreateSchema, categoryUpdateSchema, type CategoryCreateInput, type CategoryUpdateInput } from "@/lib/validations/category.schema";
import { requirePermission, Permission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function createCategoryAction(data: CategoryCreateInput) {
  try {
    const context = await requireBusinessContext();

    requirePermission(context.rol, Permission.PRODUCTOS_CREAR);

    const validatedData = categoryCreateSchema.parse(data);
    const category = await categoryService.createCategory(
      context,
      validatedData,
    );

    revalidatePath("/dashboard/categorias");
    return { success: true, data: category, message: "Categoría creada exitosamente" };
  } catch (error) {
    return {
      success: false,
      error: tenantActionError(error),
    };
  }
}

export async function getAllCategoriesAction() {
  try {
    const context = await requireBusinessContext();

    requirePermission(context.rol, Permission.PRODUCTOS_VER);

    const categories = await categoryService.getAllCategories(context);
    return { success: true, data: categories };
  } catch (error) {
    return {
      success: false,
      error: tenantActionError(error),
    };
  }
}

export async function updateCategoryAction(id: string, data: Partial<CategoryUpdateInput>) {
  try {
    const context = await requireBusinessContext();

    requirePermission(context.rol, Permission.PRODUCTOS_EDITAR);

    const validatedData = categoryUpdateSchema.parse(data);
    const category = await categoryService.updateCategory(
      context,
      parseInt(id),
      validatedData,
    );

    revalidatePath("/dashboard/categorias");
    return { success: true, data: category, message: "Categoría actualizada exitosamente" };
  } catch (error) {
    return {
      success: false,
      error: tenantActionError(error),
    };
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    const context = await requireBusinessContext();

    requirePermission(context.rol, Permission.PRODUCTOS_ELIMINAR);

    const result = await categoryService.deleteCategory(
      context,
      parseInt(id),
    );

    revalidatePath("/dashboard/categorias");
    return { success: true, data: result, message: "Categoría eliminada exitosamente" };
  } catch (error) {
    return {
      success: false,
      error: tenantActionError(error),
    };
  }
}

export async function getCategoryByIdAction(id: string) {
  try {
    const context = await requireBusinessContext();

    requirePermission(context.rol, Permission.PRODUCTOS_VER);

    const category = await categoryService.getCategoryById(context, parseInt(id, 10));
    return { success: true, data: category };
  } catch (error) {
    return {
      success: false,
      error: tenantActionError(error),
    };
  }
}
