import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const s3Client = new S3Client({
  region: process.env.AMAZON_S3_REGION!,
  credentials: {
    accessKeyId: process.env.AMAZON_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AMAZON_SECRET_ACCESS_KEY!,
  },
});

export async function uploadFileToS3(
  file: Buffer,
  filename: string,
  contentType: string,
): Promise<string> {
  const bucket = process.env.AMAZON_S3_BUCKET!;
  const region = process.env.AMAZON_S3_REGION!;
  const safeFilename = filename
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-");
  const key = `productos/${Date.now()}-${randomUUID()}-${safeFilename || "imagen"}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    }),
  );

  const encodedKey = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`;
}

export async function deleteFileFromS3ByUrl(url: string): Promise<void> {
  const bucket = process.env.AMAZON_S3_BUCKET!;
  const region = process.env.AMAZON_S3_REGION!;
  const expectedHost = `${bucket}.s3.${region}.amazonaws.com`;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return;
  }

  if (parsedUrl.host !== expectedHost) {
    return;
  }

  const key = decodeURIComponent(parsedUrl.pathname).replace(/^\/+/, "");
  if (!key) {
    return;
  }

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}
