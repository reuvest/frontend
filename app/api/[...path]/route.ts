import { NextRequest, NextResponse } from "next/server";
import { proxyToBackend } from "@/utils/apiProxy";

// ─────────────────────────────────────────────────────────────────────────
//
// Why this exists: the frontend and API live on different domains
// (vercel.app vs onrender.com). A browser calling the API directly is a
// genuinely cross-site request — cookies set by the API can never be read
// by this app's own JS (document.cookie) or by proxy.ts's server-side
// `request.cookies`, no matter what SameSite/Secure settings are used,
// because cookie storage is scoped per-domain, not per-SameSite-policy.
// Routing every API call through this same-origin proxy makes the cookie
// first-party to sproutapp-eta.vercel.app again, restoring the original
// auth design (proxy.ts route guard + isAuthed() cookie check) without
// weakening SameSite to `None`.
//
// See utils/apiProxy.ts for the actual forwarding logic (shared with the
// /sanctum/csrf-cookie route, which needs the same treatment but lives
// outside the /api prefix on the Laravel side).

export async function GET(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(request, ctx);
}
export async function POST(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(request, ctx);
}
export async function PUT(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(request, ctx);
}
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(request, ctx);
}
export async function DELETE(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(request, ctx);
}

async function handle(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path } = await params;
  const backendPath = `/api/${path.join("/")}`;
  return proxyToBackend(request, backendPath);
}