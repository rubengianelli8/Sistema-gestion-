import prisma from "@/lib/prisma";

export interface CreateProductDto {
  nombre: string;
  descripcion?: string;
  codigoBarras?: string;
  categoriaId?: number;
  precioMinorista: number;
  precioMayorista: number;
  stockActual: number;
  stockMinimo: number;
  imagenUrl?: string;
}

export interface UpdateProductDto {
  nombre?: string;
  descripcion?: string;
  codigoBarras?: string;
  categoriaId?: number;
  precioMinorista?: number;
  precioMayorista?: number;
  stockActual?: number;
  stockMinimo?: number;
  imagenUrl?: string;
}

export class ProductRepository {
  private prisma = prisma;

  async create(data: CreateProductDto) {
    return await this.prisma.product.create({ data });
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
          { nombre: { contains: query, mode: "insensitive" } },
          { codigoBarras: { contains: query, mode: "insensitive" } },
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

