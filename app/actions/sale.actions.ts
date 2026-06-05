"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { saleService, productService } from "@/services";
import {
  saleCreateSchema,
  type SaleCreateInput,
} from "@/lib/validations/sale.schema";
import { requirePermission, Permission } from "@/lib/permissions";
import prisma from "@/lib/prisma";

export type SaleProductDto = {
  id: number;
  nombre: string;
  imagenUrl: string | null;
  codigoBarras: string | null;
  precio: number;
  stockActual: number;
};

function toSaleProductDto(product: {
  id: number;
  nombre: string;
  imagenUrl: string | null;
  codigoBarras: string | null;
  precio: number;
  stock: number;
}): SaleProductDto {
  return {
    id: product.id,
    nombre: product.nombre,
    imagenUrl: product.imagenUrl,
    codigoBarras: product.codigoBarras,
    precio: product.precio ?? 0,
    stockActual: product.stock,
  };
}

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

        if (product.stock < item.cantidad) {
          throw new Error(
            `Stock insuficiente para ${product.nombre}. Stock disponible: ${product.stock}, solicitado: ${item.cantidad}`,
          );
        }

        const precioUnitario = product.precio ?? 0;
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

export async function cancelSaleAction(id: number) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.VENTAS_ANULAR);

    const sale = await saleService.cancelSale(id);
    revalidatePath("/dashboard/ventas");
    revalidatePath("/dashboard/productos");

    return { success: true, data: sale };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function searchProductsForSaleAction(query: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.VENTAS_CREAR);

    const q = query.trim();
    if (q.length < 2) {
      return { success: true, data: [] as SaleProductDto[] };
    }

    const products = await productService.searchProductsForSale(q);
    return {
      success: true,
      data: products.map(toSaleProductDto),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function lookupProductByBarcodeForSaleAction(barcode: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.VENTAS_CREAR);

    const code = barcode.trim();
    if (!code) {
      return { success: false, error: "Código de barras vacío" };
    }

    const product = await productService.getProductByBarcode(code);
    if (!product) {
      return {
        success: false,
        error: `No se encontró un producto con código ${code}`,
      };
    }

    return { success: true, data: toSaleProductDto(product) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
