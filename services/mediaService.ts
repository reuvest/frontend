import api from "../utils/api";

/* Strips a leading /api segment so an absolute URL (e.g. from the API's
   own response payload) can be re-requested through the axios instance,
   which already has its own baseURL. */
export function toRelativePath(url: string): string {
  try {
    const path = new URL(url).pathname;
    return path.replace(/^\/api/, "");
  } catch {
    return url;
  }
}

/* GET an authenticated image/file as a Blob. Used by AuthImage/useAuthImage
   for KYC docs, chat attachments, and other endpoints that need auth
   headers next/image's remote optimizer can't attach. */
export async function fetchAuthedBlob(url: string): Promise<Blob> {
  const res = await api.get(url, { responseType: "blob" });
  return res.data;
}
