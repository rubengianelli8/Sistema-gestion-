"use server";

import { requireBusinessContext, tenantActionError } from "@/lib/tenant-context";
import prisma from "@/lib/prisma";

export async function getBranchesByBusinessAction() {
  try {
    const { businessId } = await requireBusinessContext();

    const branches = await prisma.branch.findMany({
      where: { businessId },
      select: {
        id: true,
        number: true,
        direccion: true,
      },
      orderBy: { number: "asc" },
    });

    return { success: true, data: branches };
  } catch (error) {
    return {
      success: false,
      error: tenantActionError(error),
      data: [],
    };
  }
}
