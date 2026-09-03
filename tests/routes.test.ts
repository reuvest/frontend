import { describe, it, expect } from "vitest";
import { isPublicRoute, PUBLIC_ROUTES, EXACT_MATCH_ONLY_ROUTES } from "../utils/routes";

describe("isPublicRoute", () => {
  it("matches an exact public route", () => {
    expect(isPublicRoute("/login", PUBLIC_ROUTES)).toBe(true);
    expect(isPublicRoute("/support", PUBLIC_ROUTES)).toBe(true);
  });

  it("matches a nested path under a public route", () => {
    expect(isPublicRoute("/blog/my-post", PUBLIC_ROUTES)).toBe(true);
    expect(isPublicRoute("/r/abc123", PUBLIC_ROUTES)).toBe(true);
  });

  it("does not treat a route as public just because it shares a prefix", () => {
    // "/login" is public, "/logindecoy" is a different route entirely —
    // must not false-positive on a naive startsWith("/login") check.
    expect(isPublicRoute("/logindecoy", PUBLIC_ROUTES)).toBe(false);
  });

  it("rejects a protected route", () => {
    expect(isPublicRoute("/dashboard", PUBLIC_ROUTES)).toBe(false);
    expect(isPublicRoute("/wallet", PUBLIC_ROUTES)).toBe(false);
    expect(isPublicRoute("/admin", PUBLIC_ROUTES)).toBe(false);
  });

  it("treats EXACT_MATCH_ONLY_ROUTES as public only for themselves, not nested paths", () => {
    expect(EXACT_MATCH_ONLY_ROUTES).toContain("/lands");
    expect(isPublicRoute("/lands", PUBLIC_ROUTES)).toBe(true);
    // /lands/[id] (detail page) requires login even though /lands (listing) doesn't
    expect(isPublicRoute("/lands/42", PUBLIC_ROUTES)).toBe(false);
  });

  it("defaults to PUBLIC_ROUTES when no routes arg is given", () => {
    expect(isPublicRoute("/login")).toBe(true);
    expect(isPublicRoute("/dashboard")).toBe(false);
  });

  it("returns false for a route not present in an empty/custom list", () => {
    expect(isPublicRoute("/login", [])).toBe(false);
    expect(isPublicRoute("/foo", ["/foo"])).toBe(true);
  });
});
