import { NextResponse } from "next/server";

const PUBLIC_ROUTES = [
  "/",
  "/r",
  "/login",
  "/lands",
  "/register",
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
  "/verify",
];

const ADMIN_ROUTES = ["/admin"];

export function proxy(request) {
  const { pathname } = request.nextUrl;

  const token    = request.cookies.get("auth_token")?.value;
  const userRole = request.cookies.get("user_role")?.value;

  const normalizedPath = pathname.replace(/\/+$/, "") || "/";

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    route === "/"
      ? normalizedPath === "/"
      : normalizedPath === route || normalizedPath.startsWith(route + "/")
  );

  const isAdminRoute = ADMIN_ROUTES.some((route) =>
    normalizedPath.startsWith(route)
  );
  
  //waitlist redirect
  if (!token && pathname === "/register") {
    return NextResponse.redirect(new URL("/waitlist", request.url));
  }

  // Logged-in user hitting "/" or auth pages → dashboard
  if (token && (pathname === "/" || pathname === "/login" || pathname === "/register")) {
    const redirectTo = request.nextUrl.searchParams.get("redirect");
    const destination = redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // Not logged in, trying to access a protected route
  if (!token && !isPublicRoute) {
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
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
