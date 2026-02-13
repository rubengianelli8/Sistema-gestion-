import { ProductRepository, CreateProductDto, UpdateProductDto } from "@/repositories/product.repository";
import prisma from "@/lib/prisma";

export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  async createProduct(data: CreateProductDto, currentUserId: string, currentUserName: string) {
    if (data.codigoBarras) {
      const barcodeExists = await this.repository.barcodeExists(data.codigoBarras);
      if (barcodeExists) {
        throw new Error("Ya existe un producto con ese código de barras");
      }
    }

    const product = await this.repository.create(data);

    await prisma.auditLog.create({
      data: {
        usuarioId: currentUserId,
        usuarioNombre: currentUserName,
        accion: "crear",
        modulo: "productos",
        detalles: `Producto creado: ${product.nombre}`,
      },
    });

    return product;
  }

  async getAllProducts() {
    return await this.repository.findAll();
  }

  async getProductById(id: string) {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new Error("Producto no encontrado");
    }
    return product;
  }

  async searchProducts(query: string) {
    return await this.repository.search(query);
  }

  async updateProduct(id: string, data: UpdateProductDto, currentUserId: string, currentUserName: string) {
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

    await prisma.auditLog.create({
      data: {
        usuarioId: currentUserId,
        usuarioNombre: currentUserName,
        accion: "actualizar",
        modulo: "productos",
        detalles: `Producto actualizado: ${id}`,
      },
    });

    return product;
  }

  async deleteProduct(id: string, currentUserId: string, currentUserName: string) {
    const exists = await this.repository.exists(id);
    if (!exists) {
      throw new Error("Producto no encontrado");
    }

    await this.repository.delete(id);

    await prisma.auditLog.create({
      data: {
        usuarioId: currentUserId,
        usuarioNombre: currentUserName,
        accion: "eliminar",
        modulo: "productos",
        detalles: `Producto eliminado: ${id}`,
      },
    });

    return { message: "Producto eliminado exitosamente" };
  }
}

