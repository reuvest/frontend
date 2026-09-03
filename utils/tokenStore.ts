"use client";

const IS_AUTHED_COOKIE = "is_authed";

function read(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function erase(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0`;
}

/**
 * ── httpOnly cookie migration ──────────────────────────────────────────
 * The JWT and role used to live in plain (non-httpOnly) cookies written by
 * this file — meaning any JS on the page, including anything injected via
 * XSS, could read the token straight out of document.cookie. As of this
 * change, the API sets `auth_token` and `user_role` itself via Set-Cookie
 * (httpOnly, Secure, SameSite=Lax) on /login, /refresh, and clears them on
 * /logout. This file can no longer read or write those two cookies at
 * all — that's the point.
 *
 * Required backend contract (see README's Auth flow section):
 *   - POST /login, POST /refresh: `Set-Cookie: auth_token=...; HttpOnly;
 *     Secure; SameSite=Lax` (+ same for `user_role`), and a JSON body that
 *     includes `expires_at` (epoch ms) so the client can still schedule a
 *     proactive refresh without being able to decode the JWT itself.
 *   - POST /login, POST /refresh: also `Set-Cookie: is_authed=1; Secure;
 *     SameSite=Lax` (NOT httpOnly) — a non-sensitive flag, never the
 *     token, so client code can know "is there a session" without reading
 *     anything security-sensitive.
 *   - POST /logout: clears all three cookies.
 *   - Protected endpoints must accept the httpOnly cookie for auth (e.g.
 *     Laravel Sanctum's SPA cookie mode), since JS can no longer attach a
 *     Bearer header — see utils/api.js's `withCredentials: true`.
 *
 * `proxy.ts` (Next.js middleware) is unaffected: it reads cookies
 * server-side via `request.cookies`, which works the same whether or not
 * the cookie is httpOnly.
 */
export function isAuthed(): boolean {
  return read(IS_AUTHED_COOKIE) === "1";
}

/**
 * Optimistically clears the client-visible auth flag on logout, so the UI
 * updates instantly rather than waiting on the /logout round-trip (which
 * is what actually clears the httpOnly cookies).
 */
export function clearAuthedFlag(): void {
  erase(IS_AUTHED_COOKIE);
}
