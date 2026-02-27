import prisma from "@/lib/prisma";

export interface CreateQuoteDto {
  clienteId: number;
  vendedorId: number;
  total: number;
  validezDias: number;
  notas?: string;
  items: {
    productoId: number;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }[];
}

export class QuoteRepository {
  private prisma = prisma;

  async create(data: CreateQuoteDto) {
    return await this.prisma.quote.create({
      data: {
        clienteId: data.clienteId,
        vendedorId: data.vendedorId,
        total: data.total,
        validezDias: data.validezDias,
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
    return await this.prisma.quote.findMany({
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
    return await this.prisma.quote.findUnique({
      where: { id },
      include: {
        cliente: true,
        vendedor: true,
        items: {
          include: {
            producto: true,
          },
        },
      },
    });
  }
}
