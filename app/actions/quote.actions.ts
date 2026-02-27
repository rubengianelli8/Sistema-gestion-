"use server";

import { auth } from "@/app/api/auth/[...nextauth]/route";
import { quoteService } from "@/services";
import {
  quoteCreateSchema,
  type QuoteCreateInput,
} from "@/lib/validations/quote.schema";
import { requirePermission, Permission } from "@/lib/permissions";
import prisma from "@/lib/prisma";

export async function createQuoteAction(data: QuoteCreateInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.PRESUPUESTOS_CREAR);

    const validatedData = quoteCreateSchema.parse(data);

    // Obtener información de productos y calcular totales
    const items = await Promise.all(
      validatedData.items.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productoId },
        });

        if (!product) {
          throw new Error(`Producto con ID ${item.productoId} no encontrado`);
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

    const quoteData = {
      clienteId: validatedData.clienteId,
      vendedorId: parseInt(session.user.id),
      vendedorNombre: session.user.name,
      total,
      validezDias: validatedData.validezDias,
      notas: validatedData.notas,
      items,
    };

    const quote = await quoteService.createQuote(
      quoteData,
      parseInt(session.user.id),
      session.user.name,
    );

    return {
      success: true,
      data: quote,
      message: "Presupuesto creado exitosamente",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function getAllQuotesAction() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.PRESUPUESTOS_VER);

    const quotes = await quoteService.getAllQuotes();
    return { success: true, data: quotes };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function getQuoteByIdAction(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.PRESUPUESTOS_VER);

    const quote = await quoteService.getQuoteById(parseInt(id));
    return { success: true, data: quote };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
