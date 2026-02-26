"use server";

import { auth } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function getBranchesByBusinessAction() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado", data: [] };
    }

    const businessId = session.user.businessId;
    if (!businessId) {
      return { success: true, data: [] };
    }

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
      error: error instanceof Error ? error.message : "Error desconocido",
      data: [],
    };
  }
}
