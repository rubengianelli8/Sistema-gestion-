import { QuoteRepository, CreateQuoteDto } from "@/repositories/quote.repository";
import prisma from "@/lib/prisma";

export class QuoteService {
  constructor(private readonly repository: QuoteRepository) {}

  async createQuote(data: CreateQuoteDto, currentUserId: number, currentUserName: string) {
    const cliente = await prisma.client.findUnique({
      where: { id: data.clienteId },
    });

    if (!cliente) {
      throw new Error("Cliente no encontrado");
    }

    if (!cliente.activo) {
      throw new Error("El cliente está inactivo");
    }

    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productoId },
      });

      if (!product) {
        throw new Error(`Producto con ID ${item.productoId} no encontrado`);
      }
    }

    const quote = await this.repository.create(data);

    return quote;
  }

  async getAllQuotes() {
    return await this.repository.findAll();
  }

  async getQuoteById(id: number) {
    const quote = await this.repository.findById(id);
    if (!quote) {
      throw new Error("Presupuesto no encontrado");
    }
    return quote;
  }
}
