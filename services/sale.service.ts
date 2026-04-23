import { SaleRepository, CreateSaleDto } from "@/repositories/sale.repository";
import prisma from "@/lib/prisma";
import { SaleStatus } from "@prisma/client";

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

  async cancelSale(id: number) {
    return await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!sale) {
        throw new Error("Venta no encontrada");
      }
      if (sale.estado === SaleStatus.ANULADA) {
        throw new Error("La venta ya está anulada");
      }

      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productoId },
          data: { stock: { increment: item.cantidad } },
        });
      }

      return await tx.sale.update({
        where: { id },
        data: { estado: SaleStatus.ANULADA },
        include: {
          cliente: true,
          items: { include: { producto: true } },
        },
      });
    });
  }
}
