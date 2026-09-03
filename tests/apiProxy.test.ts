import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────────────────────────────────
// proxyToBackend forwards the frontend's /api/[...path] and /sanctum
// requests to the real Laravel backend (see utils/apiProxy.ts's own
// comments for the full rationale). It used to build the upstream URL by
// naively joining the catch-all route's path segments — a segment whose
// *encoded* form was "..%2f.." decodes to a literal ".." (or one
// containing a raw "/"), which then resolved against BACKEND_ROOT the same
// way "../" does in any URL, walking back out of "/api" entirely and
// reaching whatever else is routable on the backend host — bypassing every
// middleware (auth, transaction PIN, sanctions screening, rate limits)
// scoped to the "/api" route group. This locks in the fix: any path
// segment that is empty, ".", "..", or contains a "/" is rejected with a
// 400 before a request is ever sent upstream.
//
// apiProxy.ts reads BACKEND_ROOT from process.env at module-load time (a
// top-level const, not re-read per request), so each test resets the
// module registry and re-imports it fresh AFTER setting env vars — a
// plain top-level `import` would freeze BACKEND_ROOT at whatever the env
// happened to be when the file first loaded, before any beforeEach ran.
// ─────────────────────────────────────────────────────────────────────────

const BACKEND_ROOT = "http://backend.test";

function makeRequest(pathname: string, init?: { method?: string }) {
  return new NextRequest(new URL(pathname, "http://frontend.test"), init);
}

async function freshProxyToBackend() {
  const mod = await import("../utils/apiProxy");
  return mod.proxyToBackend;
}

describe("proxyToBackend", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    process.env.API_PROXY_TARGET = BACKEND_ROOT;
    fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe("path traversal", () => {
    it("rejects a path segment that decodes to '..' without ever calling fetch", async () => {
      // What "/api/..%2f..%2fsecret-admin-route" becomes once Next.js
      // decodes the catch-all segments: ["..", "..", "secret-admin-route"].
      const proxyToBackend = await freshProxyToBackend();
      const res = await proxyToBackend(makeRequest("/api/..%2f..%2fsecret"), "/api/../../secret");

      expect(fetchMock).not.toHaveBeenCalled();
      expect(res.status).toBe(400);
    });

    it("rejects a lone '..' segment", async () => {
      const proxyToBackend = await freshProxyToBackend();
      const res = await proxyToBackend(makeRequest("/api/x"), "/api/..");

      expect(fetchMock).not.toHaveBeenCalled();
      expect(res.status).toBe(400);
    });

    it("rejects a lone '.' segment", async () => {
      const proxyToBackend = await freshProxyToBackend();
      const res = await proxyToBackend(makeRequest("/api/x"), "/api/.");

      expect(fetchMock).not.toHaveBeenCalled();
      expect(res.status).toBe(400);
    });
  });

  describe("legitimate traffic", () => {
    it("forwards a normal path unchanged, staying within BACKEND_ROOT + /api", async () => {
      const proxyToBackend = await freshProxyToBackend();
      await proxyToBackend(makeRequest("/api/users/me"), "/api/users/me");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toBe(`${BACKEND_ROOT}/api/users/me`);
    });

    it("forwards the sanctum csrf-cookie path, which lives outside /api", async () => {
      const proxyToBackend = await freshProxyToBackend();
      await proxyToBackend(makeRequest("/sanctum/csrf-cookie"), "/sanctum/csrf-cookie");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toBe(`${BACKEND_ROOT}/sanctum/csrf-cookie`);
    });

    it("preserves the query string", async () => {
      const proxyToBackend = await freshProxyToBackend();
      await proxyToBackend(makeRequest("/api/lands?status=active&page=2"), "/api/lands");

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toBe(`${BACKEND_ROOT}/api/lands?status=active&page=2`);
    });

    it("does not corrupt a path segment that legitimately contains encodable characters", async () => {
      // e.g. a blog slug or search term with a space/ampersand — should be
      // re-encoded, not rejected, since it's a single real segment with no
      // "/" or ".." in it once decoded.
      const proxyToBackend = await freshProxyToBackend();
      await proxyToBackend(makeRequest("/api/blog/hello%20world"), "/api/blog/hello world");

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toBe(`${BACKEND_ROOT}/api/blog/hello%20world`);
    });
  });

  describe("misconfiguration", () => {
    it("returns 500 without calling fetch when API_PROXY_TARGET and NEXT_PUBLIC_API_URL are both unset", async () => {
      delete process.env.API_PROXY_TARGET;
      delete process.env.NEXT_PUBLIC_API_URL;

      const proxyToBackend = await freshProxyToBackend();
      const res = await proxyToBackend(makeRequest("/api/users/me"), "/api/users/me");

      expect(fetchMock).not.toHaveBeenCalled();
      expect(res.status).toBe(500);
    });
  });
});