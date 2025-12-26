import type { NextRequest } from "next/server";

import { config, env } from "@/env";

const STATIC_TRUSTED_ORIGINS = [
  env.NEXT_PUBLIC_APP_URL,
  env.BETTER_AUTH_URL,
  "https://mattis.aws.aasan.dev",
  "https://mattis.vanvikil.no",
].filter(Boolean) as string[];

const ADDITIONAL_TRUSTED_ORIGINS = (env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

export function getTrustedOrigins(request?: Request | NextRequest): string[] {
  const origins = new Set<string>([
    ...STATIC_TRUSTED_ORIGINS,
    ...ADDITIONAL_TRUSTED_ORIGINS,
  ]);

  if (config.IS_DEVELOPMENT || config.IS_TEST) {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
  }

  if (request) {
    const originHeader = request.headers.get("origin");
    if (originHeader) {
      origins.add(originHeader);
    }

    const requestUrl =
      "nextUrl" in request ? request.nextUrl : new URL(request.url);
    origins.add(`${requestUrl.protocol}//${requestUrl.host}`);
  }

  return Array.from(origins);
}
