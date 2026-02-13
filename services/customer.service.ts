import { CustomerRepository, CreateCustomerDto, UpdateCustomerDto } from "@/repositories/customer.repository";
import prisma from "@/lib/prisma";

export class CustomerService {
  constructor(private readonly repository: CustomerRepository) {}

  async createCustomer(data: CreateCustomerDto, currentUserId: number, currentUserName: string) {
    // Verificar si el email ya existe
    if (data.email) {
      const emailExists = await this.repository.findByEmail(data.email);
      if (emailExists) {
        throw new Error("Ya existe un cliente con ese email");
      }
    }

    // Verificar si el DNI ya existe
    if (data.dni) {
      const dniExists = await this.repository.findByDni(data.dni);
      if (dniExists) {
        throw new Error("Ya existe un cliente con ese DNI");
      }
    }

    const customer = await this.repository.create(data);

    await prisma.auditLog.create({
      data: {
        usuarioId: currentUserId,
        usuarioNombre: currentUserName,
        accion: "crear",
        modulo: "clientes",
        detalles: `Cliente creado: ${customer.nombre}`,
      },
    });

    return customer;
  }

  async getAllCustomers(includeInactive: boolean = false) {
    return await this.repository.findAll(includeInactive);
  }

  async getCustomerById(id: number) {
    const customer = await this.repository.findById(id);
    if (!customer) {
      throw new Error("Cliente no encontrado");
    }
    return customer;
  }

  async updateCustomer(id: number, data: UpdateCustomerDto, currentUserId: number, currentUserName: string) {
    const exists = await this.repository.exists(id);
    if (!exists) {
      throw new Error("Cliente no encontrado");
    }

    // Verificar si el email ya existe en otro cliente
    if (data.email) {
      const emailExists = await this.repository.findByEmail(data.email);
      if (emailExists && emailExists.id !== id) {
        throw new Error("Ya existe un cliente con ese email");
      }
    }

    // Verificar si el DNI ya existe en otro cliente
    if (data.dni) {
      const dniExists = await this.repository.findByDni(data.dni);
      if (dniExists && dniExists.id !== id) {
        throw new Error("Ya existe un cliente con ese DNI");
      }
    }

    const customer = await this.repository.update(id, data);

    await prisma.auditLog.create({
      data: {
        usuarioId: currentUserId,
        usuarioNombre: currentUserName,
        accion: "actualizar",
        modulo: "clientes",
        detalles: `Cliente actualizado: ${id}`,
      },
    });

    return customer;
  }

  async deleteCustomer(id: number, currentUserId: number, currentUserName: string) {
    const exists = await this.repository.exists(id);
    if (!exists) {
      throw new Error("Cliente no encontrado");
    }

    await this.repository.delete(id);

    await prisma.auditLog.create({
      data: {
        usuarioId: currentUserId,
        usuarioNombre: currentUserName,
        accion: "eliminar",
        modulo: "clientes",
        detalles: `Cliente eliminado (lógico): ${id}`,
      },
    });

    return { message: "Cliente eliminado exitosamente" };
  }
}

