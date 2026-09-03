import { NextResponse, type NextRequest } from "next/server";
import { PUBLIC_ROUTES, isPublicRoute } from "./utils/routes";

const ADMIN_ROUTES = ["/admin"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token    = request.cookies.get("auth_token")?.value;
  const userRole = request.cookies.get("user_role")?.value;

  const normalizedPath = pathname.replace(/\/+$/, "") || "/";

  const isPublic = isPublicRoute(normalizedPath, PUBLIC_ROUTES);

  // Exact match or "<route>/..." — not a bare prefix match, so a future
  // sibling route like "/admin-something" or "/administrator" can never
  // false-positive as an admin route. No such route exists today, but this
  // is the correct matching semantics regardless.
  const isAdminRoute = ADMIN_ROUTES.some(
    (route) => normalizedPath === route || normalizedPath.startsWith(`${route}/`)
  );

  //waitlist redirect
  // if (!token && pathname === "/register") {
  //   return NextResponse.redirect(new URL("/waitlist", request.url));
  // }

  // Logged-in user hitting "/" or auth pages → dashboard
  if (token && (pathname === "/" || pathname === "/login" || pathname === "/register")) {
    const redirectTo = request.nextUrl.searchParams.get("redirect");
    const destination = redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // Not logged in, trying to access a protected route
  if (!token && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin route without admin role
  if (isAdminRoute && token && userRole !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // `api` and `sanctum` are excluded here because those paths are now the
  // same-origin proxy to the Laravel backend (see app/api/[...path]/route.ts
  // and app/sanctum/csrf-cookie/route.ts) — this auth-page-redirect logic
  // must never run in front of them, or e.g. the login POST itself would
  // get redirected to /login before ever reaching the proxy, since no
  // auth_token cookie exists yet at that point.
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|api|sanctum|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};