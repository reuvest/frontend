const FALLBACK = "/no-image.jpeg";
const R2_BASE  = process.env.NEXT_PUBLIC_R2_URL?.replace(/\/$/, "") ?? "";

export interface LandImage {
  image_url?: string;
  url?: string;
  image_path?: string;
  [key: string]: unknown;
}

export interface ImageableLand {
  images?: LandImage[];
  [key: string]: unknown;
}

export interface Slide {
  src: string;
}

function resolveUrl(img?: LandImage | null): string {
  if (!img) return FALLBACK;
  const raw = img.image_url || img.url || img.image_path;
  if (!raw) return FALLBACK;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `${R2_BASE}/${raw.replace(/^\//, "")}`;
}

export function getLandImage(land?: ImageableLand | null): string {
  return resolveUrl(land?.images?.[0]);
}

export function getLandSlides(land?: ImageableLand | null): Slide[] {
  if (land?.images?.length) {
    return land.images.map((img) => ({ src: resolveUrl(img) }));
  }
  return [{ src: getLandImage(land) }];
}