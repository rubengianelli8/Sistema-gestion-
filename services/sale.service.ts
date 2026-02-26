import { SaleRepository, CreateSaleDto } from "@/repositories/sale.repository";
import prisma from "@/lib/prisma";

export class SaleService {
  constructor(private readonly repository: SaleRepository) {}

  async createSale(data: CreateSaleDto, currentUserId: number, currentUserName: string) {
    // Validar que todos los productos tengan stock suficiente
    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productoId },
      });

      if (!product) {
        throw new Error(`Producto con ID ${item.productoId} no encontrado`);
      }

      if (product.stockActual < item.cantidad) {
        throw new Error(
          `Stock insuficiente para ${product.nombre}. Stock disponible: ${product.stockActual}, solicitado: ${item.cantidad}`
        );
      }
    }

    // Crear la venta
    const sale = await this.repository.create(data);

    // Actualizar stock de productos
    for (const item of data.items) {
      await prisma.product.update({
        where: { id: item.productoId },
        data: {
          stockActual: {
            decrement: item.cantidad,
          },
        },
      });
    }

    // Eliminado porque saldoCuentaCorriente ya no existe

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        usuarioId: currentUserId,
        usuarioNombre: currentUserName,
        accion: "crear",
        modulo: "ventas",
        detalles: `Venta creada: ${sale.id} - Total: $${data.total}`,
      },
    });

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

