import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { enforceBetterAuth } from "@/lib/auth/better-auth";
import { finalizeResponse, handleCors } from "@/lib/api/cors";

const PROTECTED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function middleware(request: NextRequest) {
  const corsResult = handleCors(request);
  if (corsResult) {
    return corsResult;
  }

  if (!PROTECTED_METHODS.has(request.method.toUpperCase())) {
    return finalizeResponse(request, NextResponse.next());
  }

  const authResult = enforceBetterAuth(request);
  if (!authResult.ok) {
    return finalizeResponse(request, authResult.response);
  }

  const headers = new Headers(request.headers);
  headers.set("x-authenticated-username", authResult.username);
  headers.set("x-authenticated-user-id", authResult.userId);

  const response = NextResponse.next({
    request: {
      headers,
    },
  });

  return finalizeResponse(request, response);
}

export const config = {
  matcher: ["/api/:path*"],
  runtime: "nodejs",
};
