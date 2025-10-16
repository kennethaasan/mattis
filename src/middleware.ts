import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/authorize";
import { getTrustedOrigins } from "@/lib/auth/trusted-origins";

const PROTECTED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const ALLOWED_HEADERS = [
  "authorization",
  "content-type",
  "x-requested-with",
].join(", ");
const ALLOWED_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
].join(", ");

export async function middleware(request: NextRequest) {
  const responseHeaders = new Headers();
  const trustedOrigins = getTrustedOrigins(request);
  const origin = request.headers.get("origin");

  if (origin && trustedOrigins.includes(origin)) {
    responseHeaders.set("Access-Control-Allow-Origin", origin);
  }

  responseHeaders.set("Access-Control-Allow-Credentials", "true");
  responseHeaders.set("Access-Control-Allow-Headers", ALLOWED_HEADERS);
  responseHeaders.set("Access-Control-Allow-Methods", ALLOWED_METHODS);
  responseHeaders.append("Vary", "Origin");

  if (request.method.toUpperCase() === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: responseHeaders });
  }

  if (!PROTECTED_METHODS.has(request.method.toUpperCase())) {
    const response = NextResponse.next();
    responseHeaders.forEach((value, key) => {
      response.headers.set(key, value);
    });
    return response;
  }

  const authResult = await authenticateRequest(request.headers);
  if (!authResult.ok) {
    const response = authResult.response;
    responseHeaders.forEach((value, key) => {
      response.headers.set(key, value);
    });
    return response;
  }

  const headers = new Headers(request.headers);
  headers.set("x-authenticated-user-id", authResult.value.user.id);
  headers.set("x-authenticated-user-email", authResult.value.user.email);
  headers.set("x-authenticated-user-name", authResult.value.user.name ?? "");

  const response = NextResponse.next({
    request: {
      headers,
    },
  });

  responseHeaders.forEach((value, key) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
  runtime: "nodejs",
};
