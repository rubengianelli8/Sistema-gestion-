"use server";

import { auth } from "@/app/api/auth/[...nextauth]/route";
import { dashboardService } from "@/services";
import type { DashboardMonthlyStats } from "@/services/dashboard.service";

export async function getDashboardStatsAction(): Promise<{
  success: boolean;
  data?: DashboardMonthlyStats;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    const data = await dashboardService.getCurrentMonthStats();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
