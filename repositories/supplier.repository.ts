import prisma from "@/lib/prisma";
import { assertBusinessContext, TenantError, type BusinessContext } from "@/lib/tenant-context";
import { optionalCuit, optionalText } from "@/lib/catalog-values";

export interface CreateSupplierDto {
  nombre: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  cuit?: string;
}

export interface UpdateSupplierDto {
  nombre?: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  cuit?: string;
  activo?: boolean;
}

export class SupplierRepository {
  private prisma = prisma;

  async create(context: BusinessContext, data: CreateSupplierDto) {
    assertBusinessContext(context);
    return await this.prisma.supplier.create({
      data: {
        nombre: data.nombre,
        contacto: data.contacto,
        email: optionalText(data.email) ?? null,
        telefono: data.telefono,
        direccion: data.direccion,
        cuit: optionalCuit(data.cuit) ?? null,
        businessId: context.businessId,
      },
    });
  }

  async update(context: BusinessContext, id: number, data: UpdateSupplierDto) {
    assertBusinessContext(context);
    return await this.prisma.supplier.update({
      where: { id, businessId: context.businessId },
      data: {
        nombre: data.nombre, contacto: data.contacto, email: optionalText(data.email),
        telefono: data.telefono, direccion: data.direccion, cuit: optionalCuit(data.cuit), activo: data.activo,
      },
    });
  }

  async delete(context: BusinessContext, id: number) {
    assertBusinessContext(context);
    return await this.prisma.supplier.update({
      where: { id, businessId: context.businessId },
      data: { activo: false },
    });
  }

  async findAll(context: BusinessContext, includeInactive = false) {
    assertBusinessContext(context);
    return await this.prisma.supplier.findMany({
      where: { businessId: context.businessId, ...(includeInactive ? {} : { activo: true }) },
      orderBy: { nombre: "asc" },
    });
  }

  async findById(context: BusinessContext, id: number) {
    assertBusinessContext(context);
    return await this.prisma.supplier.findFirst({ where: { id, businessId: context.businessId } });
  }

  async findByCuit(context: BusinessContext, cuit: string) {
    assertBusinessContext(context);
    const value = optionalCuit(cuit);
    if (!value) return null;
    return await this.prisma.supplier.findFirst({ where: { businessId: context.businessId, cuit: value } });
  }

  async findAllWithPrices(context: BusinessContext, productoId: number) {
    assertBusinessContext(context);
    const product = await this.prisma.product.findFirst({ where: { id: productoId, businessId: context.businessId }, select: { id: true } });
    if (!product) throw new TenantError("Producto no encontrado");
    return await this.prisma.supplier.findMany({
      where: { businessId: context.businessId, activo: true },
      include: {
        supplierPrices: {
          where: { productoId, businessId: context.businessId },
        },
      },
      orderBy: { nombre: "asc" },
    });
  }

  async exists(context: BusinessContext, id: number): Promise<boolean> {
    assertBusinessContext(context);
    const count = await this.prisma.supplier.count({ where: { id, businessId: context.businessId } });
    return count > 0;
  }
}
