import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";

const BASE = process.env.NEXT_PUBLIC_APP_URL;

function makeRequest(pathname: string, opts: { token?: string; role?: string; search?: string } = {}) {
  const url = new URL(pathname + (opts.search ?? ""), BASE);
  const cookieParts: string[] = [];
  if (opts.token) cookieParts.push(`auth_token=${opts.token}`);
  if (opts.role) cookieParts.push(`user_role=${opts.role}`);

  return new NextRequest(url, {
    headers: cookieParts.length ? { cookie: cookieParts.join("; ") } : undefined,
  });
}

describe("proxy middleware", () => {
  describe("unauthenticated visitors", () => {
    it("allows access to public routes", () => {
      const res = proxy(makeRequest("/login"));
      expect(res.status).not.toBe(307); // no redirect
    });

    it("allows access to nested public routes", () => {
      const res = proxy(makeRequest("/blog/some-post"));
      expect(res.status).not.toBe(307);
    });

    it("redirects to /login when hitting a protected route", () => {
      const res = proxy(makeRequest("/dashboard"));
      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toContain("/login");
      expect(location).toContain("redirect=%2Fdashboard");
    });

    it("redirects to /login for admin routes too", () => {
      const res = proxy(makeRequest("/admin"));
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login");
    });

    it("preserves the attempted path in the redirect query param", () => {
      const res = proxy(makeRequest("/wallet"));
      const location = new URL(res.headers.get("location")!);
      expect(location.searchParams.get("redirect")).toBe("/wallet");
    });
  });

  describe("authenticated users", () => {
    it("allows access to protected routes with a token", () => {
      const res = proxy(makeRequest("/dashboard", { token: "jwt", role: "user" }));
      expect(res.status).not.toBe(307);
    });

    it("redirects away from / to /dashboard when already logged in", () => {
      const res = proxy(makeRequest("/", { token: "jwt", role: "user" }));
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/dashboard");
    });

    it("redirects away from /login when already logged in", () => {
      const res = proxy(makeRequest("/login", { token: "jwt", role: "user" }));
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/dashboard");
    });

    it("redirects away from /register when already logged in", () => {
      const res = proxy(makeRequest("/register", { token: "jwt", role: "user" }));
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/dashboard");
    });

    it("honors an explicit ?redirect= target when bouncing off / or /login", () => {
      const res = proxy(makeRequest("/login", { token: "jwt", role: "user", search: "?redirect=/wallet" }));
      expect(res.headers.get("location")).toContain("/wallet");
    });

    it("ignores an off-site ?redirect= value (open-redirect guard)", () => {
      const res = proxy(
        makeRequest("/login", { token: "jwt", role: "user", search: "?redirect=https://evil.example.com" })
      );
      const location = res.headers.get("location")!;
      expect(location).toContain("/dashboard");
      expect(location).not.toContain("evil.example.com");
    });
  });

  describe("admin routes", () => {
    it("allows an admin-role user into /admin", () => {
      const res = proxy(makeRequest("/admin", { token: "jwt", role: "admin" }));
      expect(res.status).not.toBe(307);
    });

    it("redirects a non-admin logged-in user away from /admin to /dashboard", () => {
      const res = proxy(makeRequest("/admin", { token: "jwt", role: "user" }));
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/dashboard");
    });

    it("redirects an unauthenticated visitor hitting /admin to /login, not /dashboard", () => {
      const res = proxy(makeRequest("/admin"));
      expect(res.headers.get("location")).toContain("/login");
    });

    it("does not false-positive on a route that merely starts with 'admin'", () => {
      // e.g. a hypothetical "/administrator" page should not be treated
      // as an admin-gated route by a naive prefix match.
      const res = proxy(makeRequest("/administrator", { token: "jwt", role: "user" }));
      expect(res.status).not.toBe(307);
    });
  });

  describe("trailing slash normalization", () => {
    it("treats a trailing-slash path the same as the bare path", () => {
      const withSlash = proxy(makeRequest("/dashboard/"));
      const bare       = proxy(makeRequest("/dashboard"));
      expect(withSlash.status).toBe(bare.status);
    });
  });
});
