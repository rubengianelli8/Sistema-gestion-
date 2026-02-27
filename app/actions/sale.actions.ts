"use server";

import { auth } from "@/app/api/auth/[...nextauth]/route";
import { saleService } from "@/services";
import {
  saleCreateSchema,
  type SaleCreateInput,
} from "@/lib/validations/sale.schema";
import { requirePermission, Permission } from "@/lib/permissions";
import prisma from "@/lib/prisma";

export async function createSaleAction(data: SaleCreateInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.VENTAS_CREAR);

    const validatedData = saleCreateSchema.parse(data);

    // Obtener información de productos y calcular totales
    const items = await Promise.all(
      validatedData.items.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productoId },
        });

        if (!product) {
          throw new Error(`Producto con ID ${item.productoId} no encontrado`);
        }

        if (1 < item.cantidad) {
          throw new Error(
            `Stock insuficiente para ${product.nombre}. Stock disponible: 1`,
          );
        }

        const precioUnitario = 0;
        const subtotal = precioUnitario * item.cantidad;

        return {
          productoId: item.productoId,
          productoNombre: product.nombre,
          cantidad: item.cantidad,
          precioUnitario,
          subtotal,
        };
      }),
    );

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    const saleData = {
      clienteId: validatedData.clienteId,
      vendedorId: parseInt(session.user.id),
      vendedorNombre: session.user.name,
      total,
      metodoPago: validatedData.metodoPago,
      notas: validatedData.notas,
      items,
    };

    const sale = await saleService.createSale(
      saleData,
      parseInt(session.user.id),
      session.user.name,
    );

    return { success: true, data: sale, message: "Venta creada exitosamente" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function getAllSalesAction() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.VENTAS_VER);

    const sales = await saleService.getAllSales();
    return { success: true, data: sales };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
