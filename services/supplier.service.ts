import { SupplierRepository } from "@/repositories/supplier.repository";

export class SupplierService {
  constructor(private readonly repository: SupplierRepository) {}

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
