import { CategoryRepository, CreateCategoryDto, UpdateCategoryDto } from "@/repositories/category.repository";
import prisma from "@/lib/prisma";

export class CategoryService {
  constructor(private readonly repository: CategoryRepository) {}

  async createCategory(data: CreateCategoryDto, currentUserId: number, currentUserName: string) {
    const nameExists = await this.repository.nameExists(data.nombre);
    if (nameExists) {
      throw new Error("Ya existe una categoría con ese nombre");
    }

    const category = await this.repository.create(data);

    return category;
  }

  async getAllCategories() {
    return await this.repository.findAll();
  }

  async getCategoryById(id: number) {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new Error("Categoría no encontrada");
    }
    return category;
  }

  async updateCategory(id: number, data: UpdateCategoryDto, currentUserId: number, currentUserName: string) {
    const exists = await this.repository.exists(id);
    if (!exists) {
      throw new Error("Categoría no encontrada");
    }

    if (data.nombre) {
      const nameExists = await this.repository.nameExists(data.nombre, id);
      if (nameExists) {
        throw new Error("Ya existe una categoría con ese nombre");
      }
    }

    const category = await this.repository.update(id, data);

    return category;
  }

  async deleteCategory(id: number, currentUserId: number, currentUserName: string) {
    const exists = await this.repository.exists(id);
    if (!exists) {
      throw new Error("Categoría no encontrada");
    }

    const productsCount = await prisma.product.count({
      where: { categoriaId: id },
    });

    if (productsCount > 0) {
      throw new Error(
        `No se puede eliminar. La categoría está siendo usada por ${productsCount} producto(s)`
      );
    }

    await this.repository.delete(id);

    return { message: "Categoría eliminada exitosamente" };
  }
}
