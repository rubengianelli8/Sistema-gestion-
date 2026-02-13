import prisma from "@/lib/prisma";

export interface CreateCategoryDto {
  nombre: string;
  descripcion?: string;
}

export interface UpdateCategoryDto {
  nombre?: string;
  descripcion?: string;
}

export class CategoryRepository {
  private prisma = prisma;

  async create(data: CreateCategoryDto) {
    return await this.prisma.category.create({ data });
  }

  async findAll() {
    return await this.prisma.category.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    return await this.prisma.category.findUnique({ where: { id } });
  }

  async findByName(nombre: string) {
    return await this.prisma.category.findUnique({ where: { nombre } });
  }

  async update(id: string, data: UpdateCategoryDto) {
    return await this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return await this.prisma.category.delete({ where: { id } });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.category.count({ where: { id } });
    return count > 0;
  }

  async nameExists(nombre: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.category.count({
      where: {
        nombre,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    return count > 0;
  }
}

