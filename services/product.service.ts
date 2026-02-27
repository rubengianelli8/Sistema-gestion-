import { ProductRepository, CreateProductDto, UpdateProductDto } from "@/repositories/product.repository";

export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  async createProduct(data: CreateProductDto, currentUserId: number, currentUserName: string) {
    if (data.codigoBarras) {
      const barcodeExists = await this.repository.barcodeExists(data.codigoBarras);
      if (barcodeExists) {
        throw new Error("Ya existe un producto con ese código de barras");
      }
    }

    const product = await this.repository.create(data);

    return product;
  }

  async getAllProducts() {
    return await this.repository.findAll();
  }

  async getProductById(id: number) {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new Error("Producto no encontrado");
    }
    return product;
  }

  async searchProducts(query: string) {
    return await this.repository.search(query);
  }

  async updateProduct(id: number, data: UpdateProductDto, currentUserId: number, currentUserName: string) {
    const exists = await this.repository.exists(id);
    if (!exists) {
      throw new Error("Producto no encontrado");
    }

    if (data.codigoBarras) {
      const barcodeExists = await this.repository.barcodeExists(data.codigoBarras, id);
      if (barcodeExists) {
        throw new Error("Ya existe un producto con ese código de barras");
      }
    }

    const product = await this.repository.update(id, data);

    return product;
  }

  async deleteProduct(id: number, currentUserId: number, currentUserName: string) {
    const exists = await this.repository.exists(id);
    if (!exists) {
      throw new Error("Producto no encontrado");
    }

    await this.repository.delete(id);

    return { message: "Producto eliminado exitosamente" };
  }
}
