import prisma from "@/lib/prisma";

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

  async create(data: CreateSupplierDto) {
    return await this.prisma.supplier.create({
      data: {
        nombre: data.nombre,
        contacto: data.contacto,
        email: data.email || undefined,
        telefono: data.telefono,
        direccion: data.direccion,
        cuit: data.cuit,
      },
    });
  }

  async update(id: number, data: UpdateSupplierDto) {
    return await this.prisma.supplier.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return await this.prisma.supplier.update({
      where: { id },
      data: { activo: false },
    });
  }

  async findAll(includeInactive = false) {
    return await this.prisma.supplier.findMany({
      where: includeInactive ? undefined : { activo: true },
      orderBy: { nombre: "asc" },
    });
  }

  async findById(id: number) {
    return await this.prisma.supplier.findUnique({ where: { id } });
  }

  async findAllWithPrices(productoId: number) {
    return await this.prisma.supplier.findMany({
      where: { activo: true },
      include: {
        supplierPrices: {
          where: { productoId },
        },
      },
      orderBy: { nombre: "asc" },
    });
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.prisma.supplier.count({ where: { id } });
    return count > 0;
  }
}
