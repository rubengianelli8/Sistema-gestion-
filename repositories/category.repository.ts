import prisma from "@/lib/prisma";

export interface CreateCategoryDto {
  nombre: string;
  descripcion?: string;
  businessId?: number;
}

export interface UpdateCategoryDto {
  nombre?: string;
  descripcion?: string;
}

export class CategoryRepository {
  private prisma = prisma;

  async create(data: CreateCategoryDto) {
    const { businessId, ...rest } = data;
    return await this.prisma.category.create({
      data: {
        ...rest,
        Business: {
          connect: { id: businessId ?? 1 },
        },
      },
    });
  }

  async findAll() {
    return await this.prisma.category.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: number) {
    return await this.prisma.category.findUnique({ where: { id } });
  }

  async findByName(nombre: string) {
    return await this.prisma.category.findUnique({ where: { nombre } });
  }

  async update(id: number, data: UpdateCategoryDto) {
    return await this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return await this.prisma.category.delete({ where: { id } });
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.prisma.category.count({ where: { id } });
    return count > 0;
  }

  async nameExists(nombre: string, excludeId?: number): Promise<boolean> {
    const count = await this.prisma.category.count({
      where: {
        nombre,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    return count > 0;
  }
}
