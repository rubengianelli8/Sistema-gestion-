import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getDashboardStatsAction } from "@/app/actions/dashboard.actions";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import type { DashboardMonthlyStats } from "@/services/dashboard.service";

const EMPTY_STATS: DashboardMonthlyStats = {
  monthLabel: "Mes actual",
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  salesCount: { total: 0, daily: [] },
  salesAmount: { total: 0, daily: [] },
  newCustomers: { total: 0, daily: [] },
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const result = await getDashboardStatsAction();
  const stats = result.success && result.data ? result.data : EMPTY_STATS;

  if (stats.salesCount.daily.length === 0) {
    const daysInMonth = new Date(stats.year, stats.month, 0).getDate();
    const emptyDaily = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      label: String(i + 1),
      value: 0,
    }));
    stats.salesCount.daily = emptyDaily;
    stats.salesAmount.daily = emptyDaily.map((d) => ({ ...d }));
    stats.newCustomers.daily = emptyDaily.map((d) => ({ ...d }));
  }

  return <DashboardView stats={stats} />;
}
