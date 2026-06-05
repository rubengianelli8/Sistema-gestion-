"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardMonthlyStats } from "@/services/dashboard.service";
import { ShoppingCart, TrendingUp, Users } from "lucide-react";

interface DashboardViewProps {
  stats: DashboardMonthlyStats;
}

type ChartConfig = {
  title: string;
  subtitle: string;
  total: number;
  totalLabel: string;
  dataKey: "salesCount" | "salesAmount" | "newCustomers";
  color: string;
  icon: React.ReactNode;
  formatValue?: (value: number) => string;
  formatTooltip?: (value: number) => string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

function MetricChart({
  title,
  subtitle,
  total,
  totalLabel,
  daily,
  color,
  icon,
  formatValue = (v) => String(v),
  formatTooltip = (v) => String(v),
}: Omit<ChartConfig, "dataKey"> & {
  daily: DashboardMonthlyStats["salesCount"]["daily"];
}) {
  const isEmpty = total === 0;

  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div
            className="shrink-0 rounded-xl p-2.5"
            style={{ backgroundColor: `${color}18`, color }}
          >
            {icon}
          </div>
        </div>
        <div className="pt-2">
          <p className="text-3xl font-bold tracking-tight">{formatValue(total)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{totalLabel}</p>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={daily}
              margin={{ top: 8, right: 4, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={36}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.35 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const value = Number(payload[0].value ?? 0);
                  return (
                    <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-md">
                      <p className="text-muted-foreground">Día {label}</p>
                      <p className="font-semibold">{formatTooltip(value)}</p>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="value"
                fill={color}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
                isAnimationActive={!isEmpty}
              />
            </BarChart>
          </ResponsiveContainer>
          {isEmpty && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="rounded-full bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm border">
                Sin datos este mes
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardView({ stats }: DashboardViewProps) {
  return (
    <div className="min-h-full">
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/10 via-background to-accent/30 px-4 py-8 sm:px-6 sm:py-10">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/4 h-40 w-40 rounded-full bg-chart-2/20 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-medium text-primary">Venta Agil</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Resumen de {stats.monthLabel}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Seguimiento diario de ventas y clientes nuevos. Los gráficos se
            actualizan con la actividad del mes en curso.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-xl border bg-card/80 backdrop-blur px-4 py-3 min-w-[140px]">
              <p className="text-xs text-muted-foreground">Ventas</p>
              <p className="text-xl font-bold">{stats.salesCount.total}</p>
            </div>
            <div className="rounded-xl border bg-card/80 backdrop-blur px-4 py-3 min-w-[160px]">
              <p className="text-xs text-muted-foreground">Facturación</p>
              <p className="text-xl font-bold">
                {formatCurrency(stats.salesAmount.total)}
              </p>
            </div>
            <div className="rounded-xl border bg-card/80 backdrop-blur px-4 py-3 min-w-[140px]">
              <p className="text-xs text-muted-foreground">Clientes nuevos</p>
              <p className="text-xl font-bold">{stats.newCustomers.total}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <MetricChart
            title="Ventas del mes"
            subtitle="Cantidad de ventas por día"
            total={stats.salesCount.total}
            totalLabel="ventas registradas"
            daily={stats.salesCount.daily}
            color="var(--chart-1)"
            icon={<ShoppingCart className="h-5 w-5" />}
          />
          <MetricChart
            title="Monto vendido"
            subtitle="Facturación diaria del mes"
            total={stats.salesAmount.total}
            totalLabel="total facturado"
            daily={stats.salesAmount.daily}
            color="var(--chart-2)"
            icon={<TrendingUp className="h-5 w-5" />}
            formatValue={formatCurrency}
            formatTooltip={formatCurrency}
          />
          <MetricChart
            title="Clientes nuevos"
            subtitle="Altas de clientes por día"
            total={stats.newCustomers.total}
            totalLabel="clientes registrados"
            daily={stats.newCustomers.daily}
            color="var(--chart-3)"
            icon={<Users className="h-5 w-5" />}
          />
        </div>
      </section>
    </div>
  );
}
