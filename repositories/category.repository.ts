import prisma from "@/lib/prisma";
import { assertBusinessContext, type BusinessContext } from "@/lib/tenant-context";

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

  async create(context: BusinessContext, data: CreateCategoryDto) {
    assertBusinessContext(context);
    return await this.prisma.category.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        businessId: context.businessId,
      },
    });
  }

  async findAll(context: BusinessContext) {
    assertBusinessContext(context);
    return await this.prisma.category.findMany({
      where: { businessId: context.businessId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(context: BusinessContext, id: number) {
    assertBusinessContext(context);
    return await this.prisma.category.findFirst({ where: { id, businessId: context.businessId } });
  }

  async findByName(context: BusinessContext, nombre: string) {
    assertBusinessContext(context);
    return await this.prisma.category.findFirst({ where: { nombre, businessId: context.businessId } });
  }

  async update(context: BusinessContext, id: number, data: UpdateCategoryDto) {
    assertBusinessContext(context);
    return await this.prisma.category.update({
      where: { id, businessId: context.businessId },
      data: { nombre: data.nombre, descripcion: data.descripcion },
    });
  }

  async delete(context: BusinessContext, id: number) {
    assertBusinessContext(context);
    return await this.prisma.category.delete({ where: { id, businessId: context.businessId } });
  }

  async exists(context: BusinessContext, id: number): Promise<boolean> {
    assertBusinessContext(context);
    const count = await this.prisma.category.count({ where: { id, businessId: context.businessId } });
    return count > 0;
  }

  async nameExists(context: BusinessContext, nombre: string, excludeId?: number): Promise<boolean> {
    assertBusinessContext(context);
    const count = await this.prisma.category.count({
      where: {
        businessId: context.businessId,
        nombre,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    return count > 0;
  }
}
