import { CustomerRepository, CreateCustomerDto, UpdateCustomerDto } from "@/repositories/customer.repository";
import { TenantError, type BusinessContext } from "@/lib/tenant-context";

export class CustomerService {
  constructor(private readonly repository: CustomerRepository) {}

  async createCustomer(context: BusinessContext, data: CreateCustomerDto) {
    if (data.email) {
      const emailExists = await this.repository.findByEmail(context, data.email);
      if (emailExists) {
        throw new TenantError("Ya existe un cliente con ese email");
      }
    }

    if (data.dni) {
      const dniExists = await this.repository.findByDni(context, data.dni);
      if (dniExists) {
        throw new TenantError("Ya existe un cliente con ese DNI");
      }
    }

    const customer = await this.repository.create(context, data);

    return customer;
  }

  async getAllCustomers(context: BusinessContext, includeInactive: boolean = false) {
    return await this.repository.findAll(context, includeInactive);
  }

  async getCustomerById(context: BusinessContext, id: number) {
    const customer = await this.repository.findById(context, id);
    if (!customer) {
      throw new TenantError("Cliente no encontrado");
    }
    return customer;
  }

  async updateCustomer(context: BusinessContext, id: number, data: UpdateCustomerDto) {
    const exists = await this.repository.exists(context, id);
    if (!exists) {
      throw new TenantError("Cliente no encontrado");
    }

    if (data.email) {
      const emailExists = await this.repository.findByEmail(context, data.email);
      if (emailExists && emailExists.id !== id) {
        throw new TenantError("Ya existe un cliente con ese email");
      }
    }

    if (data.dni) {
      const dniExists = await this.repository.findByDni(context, data.dni);
      if (dniExists && dniExists.id !== id) {
        throw new TenantError("Ya existe un cliente con ese DNI");
      }
    }

    const customer = await this.repository.update(context, id, data);

    return customer;
  }

  async deleteCustomer(context: BusinessContext, id: number) {
    const exists = await this.repository.exists(context, id);
    if (!exists) {
      throw new TenantError("Cliente no encontrado");
    }

    await this.repository.delete(context, id);

    return { message: "Cliente eliminado exitosamente" };
  }
}
