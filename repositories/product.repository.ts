import prisma from "@/lib/prisma";

export interface CreateProductDto {
  nombre: string;
  descripcion?: string;
  codigoBarras?: string;
  categoriaId?: number;
  precioMinorista?: number;
  precioMayorista?: number;
  stock?: number;
  stockActual?: number;
  stockMinimo?: number;
  imagenUrl?: string;
  branchId?: number;
}

export interface UpdateProductDto {
  nombre?: string;
  descripcion?: string;
  codigoBarras?: string;
  categoriaId?: number;
  precioMinorista?: number;
  precioMayorista?: number;
  stock?: number;
  stockMinimo?: number;
  imagenUrl?: string;
}

export class ProductRepository {
  private prisma = prisma;

  async create(data: CreateProductDto) {
    const { categoriaId, stockActual, branchId, ...rest } = data;
    return await this.prisma.product.create({
      data: {
        ...rest,
        ...(categoriaId !== undefined && { categoriaId }),
        ...(stockActual !== undefined && { stock: stockActual }),
        branchId: branchId ?? 1,
      },
    });
  }

  async findAll() {
    return await this.prisma.product.findMany({
      include: { categoria: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: number) {
    return await this.prisma.product.findUnique({
      where: { id },
      include: { categoria: true },
    });
  }

  async findByBarcode(codigoBarras: string) {
    return await this.prisma.product.findUnique({
      where: { codigoBarras },
    });
  }

  async search(query: string) {
    return await this.prisma.product.findMany({
      where: {
        OR: [
          { nombre: { contains: query } },
          { codigoBarras: { contains: query } },
        ],
      },
      include: { categoria: true },
      take: 20,
    });
  }

  async update(id: number, data: UpdateProductDto) {
    return await this.prisma.product.update({
      where: { id },
      data,
      include: { categoria: true },
    });
  }

  async delete(id: number) {
    return await this.prisma.product.delete({ where: { id } });
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.prisma.product.count({ where: { id } });
    return count > 0;
  }

  async barcodeExists(codigoBarras: string, excludeId?: number): Promise<boolean> {
    if (!codigoBarras) return false;
    const count = await this.prisma.product.count({
      where: {
        codigoBarras,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    return count > 0;
  }
}
