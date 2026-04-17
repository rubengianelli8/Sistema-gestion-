import { PurchaseRepository } from "@/repositories/purchase.repository";
import prisma from "@/lib/prisma";
import type { PurchaseCreateInput } from "@/lib/validations/purchase.schema";

export class PurchaseService {
  constructor(private readonly repository: PurchaseRepository) {}

  async createPurchase(
    data: PurchaseCreateInput,
    _userId: number,
    branchId: number,
  ) {
    const supplier = await prisma.supplier.findUnique({
      where: { id: data.proveedorId },
    });
    if (!supplier) {
      throw new Error("Proveedor no encontrado");
    }

    const products = await prisma.product.findMany({
      where: { id: { in: data.items.map((i) => i.productoId) } },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    for (const item of data.items) {
      const product = byId.get(item.productoId);
      if (!product) {
        throw new Error(`Producto ${item.productoId} no encontrado`);
      }
      if (product.branchId !== branchId) {
        throw new Error(
          `El producto "${product.nombre}" no pertenece a la sucursal actual`,
        );
      }
    }

    const itemsWithSubtotal = data.items.map((i) => ({
      productoId: i.productoId,
      productoNombre: byId.get(i.productoId)!.nombre,
      cantidad: i.cantidad,
      precioUnitario: i.precioUnitario,
      subtotal: i.precioUnitario * i.cantidad,
    }));
    const total = itemsWithSubtotal.reduce((s, i) => s + i.subtotal, 0);

    return await prisma.$transaction(async (tx) => {
      const purchase = await this.repository.create(
        {
          proveedorId: data.proveedorId,
          branchId,
          total,
          numeroFactura: data.numeroFactura,
          notas: data.notas,
          items: itemsWithSubtotal,
        },
        tx,
      );

      for (const item of itemsWithSubtotal) {
        await tx.product.update({
          where: { id: item.productoId },
          data: { stock: { increment: item.cantidad } },
        });
        await tx.supplierPrice.upsert({
          where: {
            productoId_proveedorId: {
              productoId: item.productoId,
              proveedorId: data.proveedorId,
            },
          },
          update: { precio: item.precioUnitario },
          create: {
            productoId: item.productoId,
            proveedorId: data.proveedorId,
            precio: item.precioUnitario,
          },
        });
      }

      return purchase;
    });
  }
}
