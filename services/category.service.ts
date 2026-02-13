import { CategoryRepository, CreateCategoryDto, UpdateCategoryDto } from "@/repositories/category.repository";
import prisma from "@/lib/prisma";

export class CategoryService {
  constructor(private readonly repository: CategoryRepository) {}

  async createCategory(data: CreateCategoryDto, currentUserId: string, currentUserName: string) {
    const nameExists = await this.repository.nameExists(data.nombre);
    if (nameExists) {
      throw new Error("Ya existe una categoría con ese nombre");
    }

    const category = await this.repository.create(data);

    await prisma.auditLog.create({
      data: {
        usuarioId: currentUserId,
        usuarioNombre: currentUserName,
        accion: "crear",
        modulo: "categorias",
        detalles: `Categoría creada: ${category.nombre}`,
      },
    });

    return category;
  }

  async getAllCategories() {
    return await this.repository.findAll();
  }

  async getCategoryById(id: string) {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new Error("Categoría no encontrada");
    }
    return category;
  }

  async updateCategory(id: string, data: UpdateCategoryDto, currentUserId: string, currentUserName: string) {
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

    await prisma.auditLog.create({
      data: {
        usuarioId: currentUserId,
        usuarioNombre: currentUserName,
        accion: "actualizar",
        modulo: "categorias",
        detalles: `Categoría actualizada: ${id}`,
      },
    });

    return category;
  }

  async deleteCategory(id: string, currentUserId: string, currentUserName: string) {
    const exists = await this.repository.exists(id);
    if (!exists) {
      throw new Error("Categoría no encontrada");
    }

    // Check if category is being used by products
    const productsCount = await prisma.product.count({
      where: { categoriaId: id },
    });

    if (productsCount > 0) {
      throw new Error(
        `No se puede eliminar. La categoría está siendo usada por ${productsCount} producto(s)`
      );
    }

    await this.repository.delete(id);

    await prisma.auditLog.create({
      data: {
        usuarioId: currentUserId,
        usuarioNombre: currentUserName,
        accion: "eliminar",
        modulo: "categorias",
        detalles: `Categoría eliminada: ${id}`,
      },
    });

    return { message: "Categoría eliminada exitosamente" };
  }
}

