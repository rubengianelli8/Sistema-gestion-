import prisma from "@/lib/prisma";
import { productScope, type BranchContext } from "@/lib/tenant-context";

export interface CreateProductDto {
  nombre: string;
  descripcion?: string;
  codigoBarras?: string;
  categoriaId?: number | null;
  unitId?: number | null;
  stock?: number;
  stockActual?: number;
  stockMinimo?: number;
  imagenUrl?: string;
  precio?: number;
}

export interface UpdateProductDto {
  nombre?: string;
  descripcion?: string;
  codigoBarras?: string;
  categoriaId?: number | null;
  unitId?: number | null;
  stock?: number;
  stockMinimo?: number;
  imagenUrl?: string;
  precio?: number;
}

export class ProductRepository {
  private prisma = prisma;

  async create(context: BranchContext, data: CreateProductDto) {
    const scope = productScope(context);
    return await this.prisma.product.create({
      data: {
        nombre: data.nombre, descripcion: data.descripcion, codigoBarras: data.codigoBarras,
        imagenUrl: data.imagenUrl, precio: data.precio, categoriaId: data.categoriaId,
        unitId: data.unitId, stock: data.stockActual ?? data.stock,
        stockMinimo: data.stockMinimo, branchId: scope.branchId,
      },
    });
  }

  async findAll(context: BranchContext) {
    return await this.prisma.product.findMany({
      where: productScope(context),
      include: { categoria: { where: { businessId: context.businessId } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async findPaginated(context: BranchContext, params: { q?: string; skip: number; take: number }) {
    const { q, skip, take } = params;
    const where = {
      ...productScope(context),
      ...(q ? { OR: [
            { nombre: { contains: q } },
            { codigoBarras: { contains: q } },
      ] } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { categoria: { where: { businessId: context.businessId } } },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total };
  }

  async findById(context: BranchContext, id: number) {
    return await this.prisma.product.findFirst({
      where: { id, ...productScope(context) },
      include: {
        categoria: { where: { businessId: context.businessId } },
        Unit: true,
        supplierPrices: { include: { proveedor: true } },
      },
    });
  }

  async findByBarcode(context: BranchContext, codigoBarras: string) {
    return await this.prisma.product.findFirst({
      where: { codigoBarras, ...productScope(context) },
    });
  }

  async search(context: BranchContext, query: string) {
    return await this.prisma.product.findMany({
      where: {
        ...productScope(context),
        OR: [
          { nombre: { contains: query } },
          { codigoBarras: { contains: query } },
        ],
      },
      include: { categoria: { where: { businessId: context.businessId } } },
      take: 20,
    });
  }

  async searchForSale(context: BranchContext, query: string, limit = 20) {
    const scope = productScope(context);
    const q = query.trim();
    if (!q) return [];

    return await this.prisma.product.findMany({
      where: {
        ...scope,
        stock: { gt: 0 },
        OR: [
          { nombre: { contains: q } },
          { codigoBarras: { contains: q } },
        ],
      },
      select: {
        id: true,
        nombre: true,
        imagenUrl: true,
        codigoBarras: true,
        precio: true,
        stock: true,
      },
      orderBy: { nombre: "asc" },
      take: limit,
    });
  }

  async update(context: BranchContext, id: number, data: UpdateProductDto) {
    return await this.prisma.product.update({
      where: { id, ...productScope(context) },
      data: {
        nombre: data.nombre, descripcion: data.descripcion, codigoBarras: data.codigoBarras,
        imagenUrl: data.imagenUrl, precio: data.precio, categoriaId: data.categoriaId,
        unitId: data.unitId, stock: data.stock, stockMinimo: data.stockMinimo,
      },
      include: { categoria: { where: { businessId: context.businessId } } },
    });
  }

  async delete(context: BranchContext, id: number) {
    return await this.prisma.product.delete({ where: { id, ...productScope(context) } });
  }

  async exists(context: BranchContext, id: number): Promise<boolean> {
    const count = await this.prisma.product.count({ where: { id, ...productScope(context) } });
    return count > 0;
  }

  async barcodeExists(context: BranchContext, codigoBarras: string, excludeId?: number): Promise<boolean> {
    const scope = productScope(context);
    if (!codigoBarras) return false;
    const count = await this.prisma.product.count({
      where: {
        ...scope,
        codigoBarras,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    return count > 0;
  }
}
