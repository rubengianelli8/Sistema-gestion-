import prisma from "@/lib/prisma";

export interface CreateCustomerDto {
  nombre: string;
  dni?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  limiteCredito?: number;
}

export interface UpdateCustomerDto {
  nombre?: string;
  dni?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  limiteCredito?: number;
  activo?: boolean;
}

export class CustomerRepository {
  private prisma = prisma;

  async create(data: CreateCustomerDto) {
    return await this.prisma.customer.create({ data });
  }

  async findAll(includeInactive: boolean = false) {
    return await this.prisma.customer.findMany({
      where: includeInactive ? undefined : { activo: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: number) {
    return await this.prisma.customer.findUnique({
      where: { id },
    });
  }

  async findByDni(dni: string) {
    return await this.prisma.customer.findFirst({
      where: { dni },
    });
  }

  async findByEmail(email: string) {
    return await this.prisma.customer.findUnique({
      where: { email },
    });
  }

  async update(id: number, data: UpdateCustomerDto) {
    return await this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    // Eliminación lógica
    return await this.prisma.customer.update({
      where: { id },
      data: { activo: false },
    });
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.prisma.customer.count({ where: { id } });
    return count > 0;
  }
}

