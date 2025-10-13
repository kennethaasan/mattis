import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { enforceBasicAuth } from "@/lib/auth/basic-auth";

const PROTECTED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function middleware(request: NextRequest) {
  if (!PROTECTED_METHODS.has(request.method.toUpperCase())) {
    return NextResponse.next();
  }

  const authResult = enforceBasicAuth(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const headers = new Headers(request.headers);
  headers.set("x-authenticated-username", authResult.username);
  headers.set("x-authenticated-user-id", authResult.userId);

  return NextResponse.next({
    request: {
      headers,
    },
  });
}

export const config = {
  matcher: ["/api/:path*"],
  runtime: "nodejs",
};
