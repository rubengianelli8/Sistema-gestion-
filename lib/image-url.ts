export function getKeyFromS3Url(url: string): string | null {
  const bucket = process.env.NEXT_PUBLIC_AMAZON_S3_BUCKET ?? process.env.AMAZON_S3_BUCKET;
  const region = process.env.NEXT_PUBLIC_AMAZON_S3_REGION ?? process.env.AMAZON_S3_REGION;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return null;
  }

  const hostMatchesBucket =
    bucket && region
      ? parsedUrl.host === `${bucket}.s3.${region}.amazonaws.com`
      : /\.s3\.[^.]+\.amazonaws\.com$/.test(parsedUrl.host);

  if (!hostMatchesBucket) {
    return null;
  }

  const key = decodeURIComponent(parsedUrl.pathname).replace(/^\/+/, "");
  return key || null;
}

export function getImageProxyUrl(urlOrKey: string): string {
  if (!urlOrKey) return urlOrKey;

  if (urlOrKey.startsWith("/api/images")) {
    return urlOrKey;
  }

  if (/^https?:\/\//i.test(urlOrKey)) {
    const key = getKeyFromS3Url(urlOrKey);
    if (!key) {
      return urlOrKey;
    }
    return `/api/images?key=${encodeURIComponent(key)}`;
  }

  return `/api/images?key=${encodeURIComponent(urlOrKey.replace(/^\/+/, ""))}`;
}
