import {
  SupplierRepository,
  type CreateSupplierDto,
  type UpdateSupplierDto,
} from "@/repositories/supplier.repository";

export class SupplierService {
  constructor(private readonly repository: SupplierRepository) {}

  async createSupplier(data: CreateSupplierDto) {
    return await this.repository.create(data);
  }

  async updateSupplier(id: number, data: UpdateSupplierDto) {
    if (!(await this.repository.exists(id))) {
      throw new Error("Proveedor no encontrado");
    }
    return await this.repository.update(id, data);
  }

  async deleteSupplier(id: number) {
    if (!(await this.repository.exists(id))) {
      throw new Error("Proveedor no encontrado");
    }
    await this.repository.delete(id);
    return { message: "Proveedor eliminado exitosamente" };
  }

  async getAllSuppliers(includeInactive = false) {
    return await this.repository.findAll(includeInactive);
  }

  async getSupplierById(id: number) {
    const supplier = await this.repository.findById(id);
    if (!supplier) {
      throw new Error("Proveedor no encontrado");
    }
    return supplier;
  }

  async getSuppliersByProduct(productoId: number) {
    return await this.repository.findAllWithPrices(productoId);
  }
}
