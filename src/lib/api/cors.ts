import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { env } from "@/env";

const ALLOWED_ORIGINS = new Set([
  "https://mattis.aasan.dev",
  "https://mattis.vanvikil.no",
]);

const ALLOWED_HEADERS = ["authorization", "content-type"];
const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];

function resolveAllowedOrigin(originHeader: string | null): string | null {
  if (!originHeader) {
    return null;
  }

  if (env.IS_DEVELOPMENT || env.IS_TEST) {
    return originHeader;
  }

  if (ALLOWED_ORIGINS.has(originHeader)) {
    return originHeader;
  }

  return null;
}

export function handleCors(request: NextRequest): NextResponse | null {
  const originHeader = request.headers.get("origin");
  const origin = resolveAllowedOrigin(originHeader);
  const method = request.method.toUpperCase();

  if (method === "OPTIONS") {
    if (!originHeader) {
      // Non-CORS preflight. Allow with minimal headers.
      const response = new NextResponse(null, { status: 204 });
      response.headers.set(
        "Access-Control-Allow-Methods",
        ALLOWED_METHODS.join(", "),
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        ALLOWED_HEADERS.map((header) => header.toUpperCase()).join(", "),
      );
      response.headers.set("Access-Control-Max-Age", "600");
      return response;
    }

    if (!origin) {
      return new NextResponse("Origin not allowed.", { status: 403 });
    }

    const preflight = new NextResponse(null, { status: 204 });
    applyCorsHeaders(preflight, origin);
    preflight.headers.set(
      "Access-Control-Allow-Methods",
      ALLOWED_METHODS.join(", "),
    );
    preflight.headers.set(
      "Access-Control-Allow-Headers",
      ALLOWED_HEADERS.map((header) => header.toUpperCase()).join(", "),
    );
    preflight.headers.set("Access-Control-Max-Age", "600");

    return preflight;
  }

  if (originHeader && !origin && !(env.IS_DEVELOPMENT || env.IS_TEST)) {
    return new NextResponse("Origin not allowed.", { status: 403 });
  }

  return null;
}

export function applyCorsHeaders(
  response: NextResponse,
  origin: string | null,
): void {
  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  } else if (env.IS_DEVELOPMENT || env.IS_TEST) {
    response.headers.set("Access-Control-Allow-Origin", "*");
  }

  const existingVary = response.headers.get("Vary");
  if (existingVary) {
    const varyValues = new Set(
      existingVary.split(",").map((value) => value.trim()),
    );
    varyValues.add("Origin");
    response.headers.set("Vary", Array.from(varyValues).join(", "));
  } else {
    response.headers.set("Vary", "Origin");
  }
}

export function finalizeResponse(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  const origin = resolveAllowedOrigin(request.headers.get("origin"));
  applyCorsHeaders(response, origin);
  return response;
}
