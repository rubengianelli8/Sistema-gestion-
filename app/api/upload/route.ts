import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { Permission, requirePermission } from "@/lib/permissions";
import { uploadFileToS3 } from "@/lib/s3";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    try {
      requirePermission(session.user.rol, Permission.PRODUCTOS_CREAR);
    } catch {
      requirePermission(session.user.rol, Permission.PRODUCTOS_EDITAR);
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No se recibió ninguna imagen" },
        { status: 400 },
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "El archivo debe ser una imagen válida" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "La imagen no puede superar los 5MB" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const url = await uploadFileToS3(buffer, file.name, file.type);

    return NextResponse.json({ success: true, url });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al subir la imagen",
      },
      { status: 500 },
    );
  }
}
