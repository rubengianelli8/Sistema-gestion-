import { ProductRepository, CreateProductDto, UpdateProductDto } from "@/repositories/product.repository";
import prisma from "@/lib/prisma";
import { productScope, TenantError, type BranchContext } from "@/lib/tenant-context";

export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  async validateSupplierPrices(context: BranchContext, prices?: { proveedorId: number; precio: number }[]) {
    productScope(context);
    if (prices === undefined) return;
    if (!Array.isArray(prices) || prices.some(price => !price || !Number.isSafeInteger(price.proveedorId) || price.proveedorId <= 0 || !Number.isFinite(price.precio) || price.precio < 0)) {
      throw new TenantError("Los precios de proveedor no son válidos");
    }
    const ids = [...new Set(prices.map(price => price.proveedorId))];
    if (!ids.length) return;
    const suppliers = await prisma.supplier.findMany({
      where: { id: { in: ids }, businessId: context.businessId }, select: { id: true },
    });
    if (suppliers.length !== ids.length) throw new TenantError("Proveedor no encontrado");
  }

  private async validateCategory(context: BranchContext, categoriaId?: number | null) {
    productScope(context);
    if (categoriaId == null) return;
    const category = await prisma.category.findFirst({
      where: { id: categoriaId, businessId: context.businessId }, select: { id: true },
    });
    if (!category) throw new TenantError("Categoría no encontrada");
  }

  async createProduct(context: BranchContext, data: CreateProductDto) {
    await this.validateCategory(context, data.categoriaId);
    if (data.codigoBarras) {
      const barcodeExists = await this.repository.barcodeExists(context, data.codigoBarras);
      if (barcodeExists) {
        throw new TenantError("Ya existe un producto con ese código de barras");
      }
    }

    const product = await this.repository.create(context, data);

    return product;
  }

  async getAllProducts(context: BranchContext) {
    return await this.repository.findAll(context);
  }

  async getPaginatedProducts(context: BranchContext, params: {
    q?: string;
    page: number;
    pageSize: number;
  }) {
    const { q, page, pageSize } = params;
    const skip = (Math.max(1, page) - 1) * pageSize;
    return await this.repository.findPaginated(context, { q, skip, take: pageSize });
  }

  async getProductById(context: BranchContext, id: number) {
    const product = await this.repository.findById(context, id);
    if (!product) {
      throw new TenantError("Producto no encontrado");
    }
    return product;
  }

  async searchProducts(context: BranchContext, query: string) {
    return await this.repository.search(context, query);
  }

  async searchProductsForSale(context: BranchContext, query: string) {
    return await this.repository.searchForSale(context, query);
  }

  async getProductByBarcode(context: BranchContext, codigoBarras: string) {
    return await this.repository.findByBarcode(context, codigoBarras);
  }

  async updateProduct(context: BranchContext, id: number, data: UpdateProductDto) {
    const existing = await this.getProductById(context, id);
    await this.validateCategory(context, data.categoriaId === undefined ? existing.categoriaId : data.categoriaId);

    if (data.codigoBarras) {
      const barcodeExists = await this.repository.barcodeExists(context, data.codigoBarras, id);
      if (barcodeExists) {
        throw new TenantError("Ya existe un producto con ese código de barras");
      }
    }

    const product = await this.repository.update(context, id, data);

    return product;
  }

  async deleteProduct(context: BranchContext, id: number) {
    const exists = await this.repository.exists(context, id);
    if (!exists) {
      throw new TenantError("Producto no encontrado");
    }

    await this.repository.delete(context, id);

    return { message: "Producto eliminado exitosamente" };
  }
}
