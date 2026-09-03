import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────
// Server-only backend target. Deliberately NOT prefixed with NEXT_PUBLIC_ —
// this must never ship to the client bundle; the browser only ever talks
// to our own /api/* and /sanctum/csrf-cookie routes now. Falls back to the
// old NEXT_PUBLIC_API_URL (minus its /api suffix) so this doesn't hard-fail
// in an environment where only the old var has been set yet.
const BACKEND_ROOT = (
  process.env.API_PROXY_TARGET ||
  (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/?$/, "")
).replace(/\/$/, "");

// Headers that must NOT be blindly forwarded from the upstream response:
// - content-encoding/content-length/transfer-encoding: the fetch() call
//   below already transparently decompresses the body, so re-forwarding
//   the original compression headers would make the browser try to
//   decode an already-decoded body and corrupt it.
// - connection/keep-alive: hop-by-hop, meaningless (and sometimes
//   disallowed) to set on a fetch Response in the edge/node runtime.
const STRIPPED_RESPONSE_HEADERS = new Set([
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
  "keep-alive",
]);

/**
 * Strips the Domain= attribute from a Set-Cookie string so the cookie
 * always ends up host-only against whatever domain this proxy is running
 * on (sproutapp-eta.vercel.app / a preview URL / custom domain), rather
 * than whatever SESSION_DOMAIN the Laravel backend happens to be
 * configured with. A Domain that doesn't match this app's own host would
 * cause the browser to silently reject the cookie.
 */
function toHostOnlyCookie(setCookieValue: string): string {
  return setCookieValue.replace(/;\s*domain=[^;]*/i, "");
}

const UNSAFE_PATH_SEGMENT = /^\.\.?$/;

function isSafePathSegments(segments: string[]): boolean {
  return segments.every(
    (seg) => seg.length > 0 && !UNSAFE_PATH_SEGMENT.test(seg) && !seg.includes("/")
  );
}

export async function proxyToBackend(
  request: NextRequest,
  backendPath: string
): Promise<NextResponse> {
  if (!BACKEND_ROOT) {
    return NextResponse.json(
      { message: "API proxy misconfigured: API_PROXY_TARGET is not set." },
      { status: 500 }
    );
  }

  // backendPath is e.g. "/api/users/me" or "/sanctum/csrf-cookie" — split
  // on "/" and drop the empty strings produced by the leading slash (and by
  // any accidental "//") to get the real segments, then validate each one
  // before it's used to build the upstream URL.
  const segments = backendPath.split("/").filter(Boolean);
  if (!isSafePathSegments(segments)) {
    return NextResponse.json({ message: "Invalid path." }, { status: 400 });
  }

  const search = request.nextUrl.search; // includes leading "?" or ""
  // Rebuild from the validated, individually re-encoded segments (rather
  // than reusing the original backendPath string) so nothing decoded out
  // of one segment can reintroduce a "/" or ".." once joined.
  const safePath = "/" + segments.map(encodeURIComponent).join("/");
  const targetUrl = `${BACKEND_ROOT}${safePath}${search}`;

  const forwardHeaders = new Headers();
  const passthroughRequestHeaders = [
    "content-type",
    "accept",
    "authorization",
    "x-xsrf-token",
    "x-csrf-token",
    "x-requested-with",
  ];
  for (const name of passthroughRequestHeaders) {
    const value = request.headers.get(name);
    if (value) forwardHeaders.set(name, value);
  }
  // Forward the browser's own cookies (auth_token, user_role, is_authed,
  // XSRF-TOKEN, laravel_session, etc.) on to the real backend — this is a
  // server-to-server call, so domain scoping doesn't restrict us here the
  // way it does in browser JS.
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) forwardHeaders.set("cookie", cookieHeader);

  const hasBody = !["GET", "HEAD"].includes(request.method);

  let backendResponse: Response;
  try {
    backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers: forwardHeaders,
      body: hasBody ? await request.arrayBuffer() : undefined,
      // "follow" (the default), not "manual": with `manual`, a redirect
      // from the upstream (e.g. a trailing-slash or HTTPS-enforcement
      // redirect from Laravel) comes back as an opaque-redirect Response
      // with status 0 — and `new NextResponse(body, { status: 0 })` below
      // throws a RangeError (valid range is 200–599), which is an
      // unhandled exception that surfaces to the browser as a bare,
      // empty-body 500 with no useful trace. Following transparently here
      // is also just the correct behavior for a proxy: the browser should
      // see the final response, not have to re-issue the redirect itself
      // against a URL it was never given (the real backend host is
      // intentionally hidden from the client).
      redirect: "follow",
      cache: "no-store",
    });
  } catch (err) {
    console.error(`[apiProxy] fetch to ${targetUrl} failed:`, err);
    return NextResponse.json(
      { message: "Upstream API request failed (network error or timeout)." },
      { status: 502 }
    );
  }

  let response: NextResponse;
  try {
    const responseBody = await backendResponse.arrayBuffer();

    // Per the Fetch spec, Responses with status 204/205/304 are "null
    // body statuses" — passing any body at all (even an empty
    // ArrayBuffer) throws "Invalid response status code". Sanctum's
    // csrf-cookie endpoint legitimately returns 204, so this isn't an
    // edge case to shrug off.
    const NULL_BODY_STATUSES = new Set([204, 205, 304]);
    const bodyForResponse = NULL_BODY_STATUSES.has(backendResponse.status)
      ? null
      : responseBody;

    response = new NextResponse(bodyForResponse, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
    });

    backendResponse.headers.forEach((value, key) => {
      if (STRIPPED_RESPONSE_HEADERS.has(key.toLowerCase())) return;
      if (key.toLowerCase() === "set-cookie") return; // handled separately below
      response.headers.set(key, value);
    });

    // Response.headers.get("set-cookie") collapses multiple cookies into
    // one comma-joined string in most fetch implementations, which is not
    // parseable back into individual cookies — getSetCookie() (Node
    // 18.17+/undici) is the only reliable way to get each Set-Cookie
    // separately.
    const rawSetCookies =
      typeof backendResponse.headers.getSetCookie === "function"
        ? backendResponse.headers.getSetCookie()
        : [];

    for (const cookie of rawSetCookies) {
      response.headers.append("set-cookie", toHostOnlyCookie(cookie));
    }
  } catch (err) {
    // Anything unexpected past this point (header copying, body reading,
    // etc.) now fails loud with a real message in Vercel's function logs
    // and a real JSON body to the client, instead of an opaque empty 500.
    console.error(`[apiProxy] error building response for ${targetUrl}:`, err);
    return NextResponse.json(
      { message: "API proxy failed while building the response." },
      { status: 500 }
    );
  }

  return response;
}