import {
  SupplierRepository,
  type CreateSupplierDto,
  type UpdateSupplierDto,
} from "@/repositories/supplier.repository";
import { TenantError, type BusinessContext } from "@/lib/tenant-context";

export class SupplierService {
  constructor(private readonly repository: SupplierRepository) {}

  async createSupplier(context: BusinessContext, data: CreateSupplierDto) {
    if (data.cuit && await this.repository.findByCuit(context, data.cuit)) throw new TenantError("Ya existe un proveedor con ese CUIT");
    return await this.repository.create(context, data);
  }

  async updateSupplier(context: BusinessContext, id: number, data: UpdateSupplierDto) {
    if (!(await this.repository.exists(context, id))) {
      throw new TenantError("Proveedor no encontrado");
    }
    const existing = data.cuit ? await this.repository.findByCuit(context, data.cuit) : null;
    if (existing && existing.id !== id) throw new TenantError("Ya existe un proveedor con ese CUIT");
    return await this.repository.update(context, id, data);
  }

  async deleteSupplier(context: BusinessContext, id: number) {
    if (!(await this.repository.exists(context, id))) {
      throw new TenantError("Proveedor no encontrado");
    }
    await this.repository.delete(context, id);
    return { message: "Proveedor eliminado exitosamente" };
  }

  async getAllSuppliers(context: BusinessContext, includeInactive = false) {
    return await this.repository.findAll(context, includeInactive);
  }

  async getSupplierById(context: BusinessContext, id: number) {
    const supplier = await this.repository.findById(context, id);
    if (!supplier) {
      throw new TenantError("Proveedor no encontrado");
    }
    return supplier;
  }

  async getSuppliersByProduct(context: BusinessContext, productoId: number) {
    return await this.repository.findAllWithPrices(context, productoId);
  }
}
