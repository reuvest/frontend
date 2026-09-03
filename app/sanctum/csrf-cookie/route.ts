import { NextRequest, NextResponse } from "next/server";
import { proxyToBackend } from "../../../utils/apiProxy";

// Sanctum's CSRF bootstrap endpoint (utils/api.ts's fetchCsrfCookie) lives
// at the API's root, not under /api — see AuthController.php's cors.php
// 'paths' config. Proxied the same way as app/api/[...path]/route.ts so
// its Set-Cookie (XSRF-TOKEN) also lands first-party on this app's domain.

export async function GET(request: NextRequest): Promise<NextResponse> {
  return proxyToBackend(request, "/sanctum/csrf-cookie");
}