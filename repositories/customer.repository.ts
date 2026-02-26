import prisma from "@/lib/prisma";

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

  async create(data: CreateCustomerDto) {
    return await this.prisma.client.create({ data: {...data, businessId: 1} });
  }

  async findAll(includeInactive: boolean = false) {
    return await this.prisma.client.findMany({
      where: includeInactive ? undefined : { activo: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: number) {
    return await this.prisma.client.findUnique({
      where: { id },
    });
  }

  async findByDni(dni: string) {
    return await this.prisma.client.findFirst({
      where: { dni },
    });
  }

  async findByEmail(email: string) {
    return await this.prisma.client.findUnique({
      where: { email },
    });
  }

  async update(id: number, data: UpdateCustomerDto) {
    return await this.prisma.client.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    // Eliminación lógica
    return await this.prisma.client.update({
      where: { id },
      data: { activo: false },
    });
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.prisma.client.count({ where: { id } });
    return count > 0;
  }
}

