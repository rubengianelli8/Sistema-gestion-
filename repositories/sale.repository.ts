import prisma from "@/lib/prisma";

export interface CreateSaleDto {
  clienteId?: number;
  vendedorId: number;
  vendedorNombre?: string;
  total: number;
  metodoPago: string;
  notas?: string;
  branchId?: number;
  items: {
    productoId: number;
    productoNombre?: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    porcentajeGanancia?: number;
    ganancia_neta?: number;
    porcentajeDescuento?: number;
    taxId?: number;
  }[];
}

export class SaleRepository {
  private prisma = prisma;

  async create(data: CreateSaleDto) {
    return await this.prisma.sale.create({
      data: {
        clienteId: data.clienteId,
        vendedorId: data.vendedorId,
        total: data.total,
        metodoPago: data.metodoPago as any,
        notas: data.notas,
        branchId: data.branchId ?? 1,
        items: {
          create: data.items.map((item) => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.subtotal,
            porcentajeGanancia: item.porcentajeGanancia ?? 0,
            ganancia_neta: item.ganancia_neta ?? 0,
            porcentajeDescuento: item.porcentajeDescuento ?? 0,
            ...(item.taxId !== undefined && { taxId: item.taxId }),
          })),
        },
      },
      include: {
        cliente: true,
        items: {
          include: {
            producto: true,
          },
        },
      },
    });
  }

  async findAll() {
    return await this.prisma.sale.findMany({
      include: {
        cliente: true,
        items: {
          include: {
            producto: true,
          },
        },
      },
      orderBy: { fecha: "desc" },
    });
  }

  async findById(id: number) {
    return await this.prisma.sale.findUnique({
      where: { id },
      include: {
        cliente: true,
        items: {
          include: {
            producto: true,
          },
        },
      },
    });
  }
}
