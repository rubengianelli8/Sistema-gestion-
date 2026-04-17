import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { PurchaseStatus } from "@prisma/client";

export interface CreatePurchaseItemDto {
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface CreatePurchaseDto {
  proveedorId: number;
  branchId: number;
  total: number;
  numeroFactura?: string;
  notas?: string;
  items: CreatePurchaseItemDto[];
}

export class PurchaseRepository {
  private prisma = prisma;

  async create(data: CreatePurchaseDto, tx: Prisma.TransactionClient) {
    return await tx.purchase.create({
      data: {
        proveedorId: data.proveedorId,
        branchId: data.branchId,
        total: data.total,
        estado: PurchaseStatus.RECIBIDA,
        fechaRecepcion: new Date(),
        numeroFactura: data.numeroFactura,
        notas: data.notas,
        items: {
          create: data.items.map((item) => ({
            productoId: item.productoId,
            productoNombre: item.productoNombre,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.subtotal,
          })),
        },
      },
      include: {
        proveedor: true,
        items: {
          include: {
            producto: true,
          },
        },
      },
    });
  }

  async findAll() {
    return await this.prisma.purchase.findMany({
      include: {
        proveedor: true,
        items: {
          include: {
            producto: true,
          },
        },
      },
      orderBy: { fecha: "desc" },
    });
  }
}
