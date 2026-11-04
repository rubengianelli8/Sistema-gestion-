import prisma from "@/lib/prisma";
import { assertBusinessContext, type BusinessContext } from "@/lib/tenant-context";

export interface CreateCustomerDto {
  nombre: string;
  dni: string;
  email?: string;
  telefono: string;
  direccion: string;
}

export interface UpdateCustomerDto {
  nombre?: string;
  dni?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  activo?: boolean;
}

export class CustomerRepository {
  private prisma = prisma;

  async create(context: BusinessContext, data: CreateCustomerDto) {
    assertBusinessContext(context);
    return await this.prisma.client.create({ data: {
      nombre: data.nombre, dni: data.dni, email: data.email || null,
      telefono: data.telefono, direccion: data.direccion, businessId: context.businessId,
    } });
  }

  async findAll(context: BusinessContext, includeInactive: boolean = false) {
    assertBusinessContext(context);
    return await this.prisma.client.findMany({
      where: { businessId: context.businessId, ...(includeInactive ? {} : { activo: true }) },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(context: BusinessContext, id: number) {
    assertBusinessContext(context);
    return await this.prisma.client.findFirst({
      where: { id, businessId: context.businessId },
    });
  }

  async findByDni(context: BusinessContext, dni: string) {
    assertBusinessContext(context);
    return await this.prisma.client.findFirst({
      where: { dni, businessId: context.businessId },
    });
  }

  async findByEmail(context: BusinessContext, email: string) {
    assertBusinessContext(context);
    return await this.prisma.client.findFirst({
      where: { email, businessId: context.businessId },
    });
  }

  async update(context: BusinessContext, id: number, data: UpdateCustomerDto) {
    assertBusinessContext(context);
    return await this.prisma.client.update({
      where: { id, businessId: context.businessId },
      data: {
        nombre: data.nombre, dni: data.dni, email: data.email === "" ? null : data.email,
        telefono: data.telefono, direccion: data.direccion, activo: data.activo,
      },
    });
  }

  async delete(context: BusinessContext, id: number) {
    assertBusinessContext(context);
    // Eliminación lógica
    return await this.prisma.client.update({
      where: { id, businessId: context.businessId },
      data: { activo: false },
    });
  }

  async exists(context: BusinessContext, id: number): Promise<boolean> {
    assertBusinessContext(context);
    const count = await this.prisma.client.count({ where: { id, businessId: context.businessId } });
    return count > 0;
  }
}

