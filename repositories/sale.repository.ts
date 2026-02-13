import prisma from "@/lib/prisma";

export interface CreateSaleDto {
  clienteId?: number;
  vendedorId: number;
  vendedorNombre: string;
  total: number;
  metodoPago: string;
  notas?: string;
  items: {
    productoId: number;
    productoNombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }[];
}

export class SaleRepository {
  private prisma = prisma;

  async create(data: CreateSaleDto) {
    return await this.prisma.sale.create({
      data: {
        clienteId: data.clienteId,
        vendedorId: data.vendedorId,
        vendedorNombre: data.vendedorNombre,
        total: data.total,
        metodoPago: data.metodoPago as any,
        notas: data.notas,
        items: {
          create: data.items,
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

