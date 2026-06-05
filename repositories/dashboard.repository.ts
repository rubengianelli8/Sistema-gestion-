import prisma from "@/lib/prisma";
import { SaleStatus } from "@prisma/client";

export class DashboardRepository {
  private prisma = prisma;

  async getSalesInMonth(start: Date, end: Date) {
    return await this.prisma.sale.findMany({
      where: {
        fecha: { gte: start, lt: end },
        estado: { not: SaleStatus.ANULADA },
      },
      select: { fecha: true, total: true },
    });
  }

  async getNewClientsInMonth(start: Date, end: Date) {
    return await this.prisma.client.findMany({
      where: {
        createdAt: { gte: start, lt: end },
      },
      select: { createdAt: true },
    });
  }
}
