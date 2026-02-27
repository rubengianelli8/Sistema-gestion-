import { SaleRepository, CreateSaleDto } from "@/repositories/sale.repository";
import prisma from "@/lib/prisma";

export class SaleService {
  constructor(private readonly repository: SaleRepository) {}

  async createSale(data: CreateSaleDto, currentUserId: number, currentUserName: string) {
    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productoId },
      });

      if (!product) {
        throw new Error(`Producto con ID ${item.productoId} no encontrado`);
      }

      if (product.stock < item.cantidad) {
        throw new Error(
          `Stock insuficiente para ${product.nombre}. Stock disponible: ${product.stock}, solicitado: ${item.cantidad}`
        );
      }
    }

    const sale = await this.repository.create(data);

    for (const item of data.items) {
      await prisma.product.update({
        where: { id: item.productoId },
        data: {
          stock: {
            decrement: item.cantidad,
          },
        },
      });
    }

    return sale;
  }

  async getAllSales() {
    return await this.repository.findAll();
  }

  async getSaleById(id: number) {
    const sale = await this.repository.findById(id);
    if (!sale) {
      throw new Error("Venta no encontrada");
    }
    return sale;
  }
}
