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
export async function compressImage(file, {
  maxPx      = 1280,
  maxBytes   = 500 * 1024,   // 500 KB
  quality    = 0.82,
  minQuality = 0.50,
  mimeType   = "image/jpeg",
} = {}) {
  // Non-image or tiny files pass through untouched
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= maxBytes) return file;

  const bitmap = await createImageBitmap(file);
  const { width: w, height: h } = bitmap;

  // Scale to fit within maxPx × maxPx, preserving aspect ratio
  const scale  = Math.min(1, maxPx / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width  = Math.round(w * scale);
  canvas.height = Math.round(h * scale);

  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  // Step quality down until the blob fits or we hit minQuality
  let q = quality;
  let blob;
  do {
    blob = await new Promise((res) => canvas.toBlob(res, mimeType, q));
    if (blob.size <= maxBytes) break;
    q = Math.round((q - 0.05) * 100) / 100;
  } while (q >= minQuality);

  // Re-wrap as a File so FormData still has a proper filename
  const ext      = mimeType === "image/jpeg" ? "jpg" : "png";
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}.${ext}`, { type: mimeType });
}