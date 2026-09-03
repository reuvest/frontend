/**
 * Pages where the shared Header and Footer are HIDDEN.
 * These are standalone auth flows with their own minimal layout.
 *
 * The landing page "/", "/support", and all app pages show the normal nav.
 */
export const NAV_HIDDEN_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

/**
 * Routes reachable without an auth token — guest/marketing pages and
 * standalone auth flows. Used to decide:
 *   - proxy.ts: which routes bypass the "must be logged in" redirect
 *   - utils/api.js: which pages should never bounce to /login on a 401
 *   - context/AuthContext.jsx: same, for the initial /me check on mount
 *
 * Single source of truth — previously these three lived as separate,
 * slightly-drifted copies (AuthContext had a stray "/reset-password" that
 * isn't a real route, and was missing "/waitlist", "/blog", "/verify").
 */
export const PUBLIC_ROUTES = [
  "/",
  "/r",
  "/login",
  "/lands",
  "/register",
  "/verify",
  "/verify-email",
  "/email-verified",
  "/forgot-password",
  "/reset-verify",
  "/set-new-password",
  "/support",
  "/terms",
  "/privacy",
  "/waitlist",
  "/blog",
];

/**
 * Most PUBLIC_ROUTES are public for themselves and everything nested under
 * them (e.g. "/blog" covers "/blog/my-post"). A few need an exact match
 * only, because a nested path under them is gated even though the parent
 * isn't — e.g. "/lands" (listing) is public but "/lands/[id]" (detail)
 * requires login.
 */
export const EXACT_MATCH_ONLY_ROUTES = ["/lands"];

/** True if `pathname` is an exact match or nested under one of `routes`. */
export function isPublicRoute(pathname: string, routes: readonly string[] = PUBLIC_ROUTES): boolean {
  return routes.some((route) => {
    if ((EXACT_MATCH_ONLY_ROUTES as readonly string[]).includes(route)) {
      return pathname === route;
    }
    return pathname === route || pathname.startsWith(route + "/");
  });
}
