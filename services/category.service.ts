import { CategoryRepository, CreateCategoryDto, UpdateCategoryDto } from "@/repositories/category.repository";
import prisma from "@/lib/prisma";
import { assertBusinessContext, TenantError, type BusinessContext } from "@/lib/tenant-context";

export class CategoryService {
  constructor(private readonly repository: CategoryRepository) {}

  async createCategory(context: BusinessContext, data: CreateCategoryDto) {
    const nameExists = await this.repository.nameExists(context, data.nombre);
    if (nameExists) {
      throw new TenantError("Ya existe una categoría con ese nombre");
    }

    const category = await this.repository.create(context, data);

    return category;
  }

  async getAllCategories(context: BusinessContext) {
    return await this.repository.findAll(context);
  }

  async getCategoryById(context: BusinessContext, id: number) {
    const category = await this.repository.findById(context, id);
    if (!category) {
      throw new TenantError("Categoría no encontrada");
    }
    return category;
  }

  async updateCategory(context: BusinessContext, id: number, data: UpdateCategoryDto) {
    const exists = await this.repository.exists(context, id);
    if (!exists) {
      throw new TenantError("Categoría no encontrada");
    }

    if (data.nombre) {
      const nameExists = await this.repository.nameExists(context, data.nombre, id);
      if (nameExists) {
        throw new TenantError("Ya existe una categoría con ese nombre");
      }
    }

    const category = await this.repository.update(context, id, data);

    return category;
  }

  async deleteCategory(context: BusinessContext, id: number) {
    assertBusinessContext(context);
    const exists = await this.repository.exists(context, id);
    if (!exists) {
      throw new TenantError("Categoría no encontrada");
    }

    const productsCount = await prisma.product.count({
      // The composite FK now guarantees that every referencing product belongs to this business.
      where: { categoriaId: id, businessId: context.businessId },
    });

    if (productsCount > 0) {
      throw new TenantError("No se puede eliminar una categoría en uso");
    }

    await this.repository.delete(context, id);

    return { message: "Categoría eliminada exitosamente" };
  }
}
