import { DashboardRepository } from "@/repositories/dashboard.repository";

export type DashboardDailyPoint = {
  label: string;
  day: number;
  value: number;
};

export type DashboardMetricSeries = {
  total: number;
  daily: DashboardDailyPoint[];
};

export type DashboardMonthlyStats = {
  monthLabel: string;
  year: number;
  month: number;
  salesCount: DashboardMetricSeries;
  salesAmount: DashboardMetricSeries;
  newCustomers: DashboardMetricSeries;
};

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function getMonthBounds(reference = new Date()) {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 1, 0, 0, 0, 0);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return { start, end, daysInMonth, year, month };
}

function buildEmptyDailySeries(daysInMonth: number): DashboardDailyPoint[] {
  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    return {
      day,
      label: String(day),
      value: 0,
    };
  });
}

function aggregateByDay(
  daysInMonth: number,
  entries: { date: Date; value: number }[],
): DashboardDailyPoint[] {
  const series = buildEmptyDailySeries(daysInMonth);

  for (const entry of entries) {
    const day = entry.date.getDate();
    if (day >= 1 && day <= daysInMonth) {
      series[day - 1].value += entry.value;
    }
  }

  return series;
}

export class DashboardService {
  constructor(private repository: DashboardRepository) {}

  async getCurrentMonthStats(
    reference = new Date(),
  ): Promise<DashboardMonthlyStats> {
    const { start, end, daysInMonth, year, month } = getMonthBounds(reference);

    const [sales, clients] = await Promise.all([
      this.repository.getSalesInMonth(start, end),
      this.repository.getNewClientsInMonth(start, end),
    ]);

    const salesCountDaily = aggregateByDay(
      daysInMonth,
      sales.map((sale) => ({ date: sale.fecha, value: 1 })),
    );

    const salesAmountDaily = aggregateByDay(
      daysInMonth,
      sales.map((sale) => ({ date: sale.fecha, value: sale.total })),
    );

    const newCustomersDaily = aggregateByDay(
      daysInMonth,
      clients.map((client) => ({ date: client.createdAt, value: 1 })),
    );

    return {
      monthLabel: `${MONTH_NAMES[month]} ${year}`,
      year,
      month: month + 1,
      salesCount: {
        total: sales.length,
        daily: salesCountDaily,
      },
      salesAmount: {
        total: sales.reduce((sum, sale) => sum + sale.total, 0),
        daily: salesAmountDaily,
      },
      newCustomers: {
        total: clients.length,
        daily: newCustomersDaily,
      },
    };
  }
}
