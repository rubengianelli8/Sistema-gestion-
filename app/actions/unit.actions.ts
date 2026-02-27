"use server";

import { auth } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function getAllUnitsAction() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    const units = await prisma.unit.findMany({
      orderBy: { nombre: "asc" },
    });

    return { success: true, data: units };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
