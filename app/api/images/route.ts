import { NextResponse } from "next/server";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

const ALLOWED_PREFIX = "productos/";

const s3Client = new S3Client({
  region: process.env.AMAZON_S3_REGION!,
  credentials: {
    accessKeyId: process.env.AMAZON_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AMAZON_SECRET_ACCESS_KEY!,
  },
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawKey = searchParams.get("key");

  if (!rawKey) {
    return NextResponse.json({ error: "Falta el parámetro key" }, { status: 400 });
  }

  const key = rawKey.replace(/^\/+/, "");

  if (!key.startsWith(ALLOWED_PREFIX) || key.includes("..")) {
    return NextResponse.json({ error: "Key inválida" }, { status: 400 });
  }

  try {
    const result = await s3Client.send(
      new GetObjectCommand({
        Bucket: process.env.AMAZON_S3_BUCKET!,
        Key: key,
      }),
    );

    const body = result.Body;
    if (!body) {
      return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });
    }

    const webStream = body.transformToWebStream();
    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Type": result.ContentType ?? "application/octet-stream",
        "Content-Length": result.ContentLength ? String(result.ContentLength) : "",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    const status =
      typeof error === "object" && error !== null && "$metadata" in error
        ? ((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode ?? 500)
        : 500;
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error al obtener la imagen",
      },
      { status },
    );
  }
}
