/**
 * compressImage(file, options) → Promise<File>
 *
 * Resizes and re-encodes an image file using the Canvas API.
 * Returns a new File object with the same name but compressed contents.
 *
 * Defaults: max 1280px on the longest side, max 500 KB, JPEG quality 0.82.
 * If the output is still over maxBytes after the first pass, quality is
 * stepped down in 0.05 increments until it fits or hits minQuality (0.5).
 */
interface CompressImageOptions {
  maxPx?: number;
  maxBytes?: number;
  quality?: number;
  minQuality?: number;
  mimeType?: string;
}

export async function compressImage(file: File, {
  maxPx      = 1280,
  maxBytes   = 500 * 1024,   // 500 KB
  quality    = 0.82,
  minQuality = 0.50,
  mimeType   = "image/jpeg",
}: CompressImageOptions = {}): Promise<File> {
  // Non-image files pass through untouched
  if (!file.type.startsWith("image/")) return file;

  const bitmap = await createImageBitmap(file);
  const { width: w, height: h } = bitmap;

  // Small-enough files are only skipped if their dimensions are also
  // within maxPx — a heavily-compressed phone/drone photo can be well
  // under maxBytes while still being 4000px+ on a side, and letting
  // those through unresized is what was causing Vercel's Image
  // Optimization API to reject them (source image too large) even
  // though most uploads compressed down fine.
  if (file.size <= maxBytes && Math.max(w, h) <= maxPx) {
    bitmap.close();
    return file;
  }

  // Scale to fit within maxPx × maxPx, preserving aspect ratio
  const scale  = Math.min(1, maxPx / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width  = Math.round(w * scale);
  canvas.height = Math.round(h * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  // Step quality down until the blob fits or we hit minQuality
  let q = quality;
  let blob: Blob | null;
  do {
    blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, mimeType, q));
    if (blob && blob.size <= maxBytes) break;
    q = Math.round((q - 0.05) * 100) / 100;
  } while (q >= minQuality);

  if (!blob) return file;

  // Re-wrap as a File so FormData still has a proper filename
  const ext      = mimeType === "image/jpeg" ? "jpg" : "png";
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}.${ext}`, { type: mimeType });
}
