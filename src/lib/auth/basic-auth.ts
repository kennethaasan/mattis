import { Buffer } from "node:buffer";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "@/env";

export interface AuthSuccess {
  ok: true;
  username: string;
  userId: string;
}

export interface AuthFailure {
  ok: false;
  response: NextResponse;
}

export type AuthResult = AuthSuccess | AuthFailure;

const BASIC_AUTH_REALM = "Mattis API";
const AUTHORIZATION_PREFIX = "Basic ";

export function enforceBasicAuth(req: NextRequest): AuthResult {
  return authenticateHeaders(req.headers);
}

export function authenticateHeaders(headers: Headers): AuthResult {
  if (env.IS_DEVELOPMENT || env.IS_TEST) {
    return {
      ok: true,
      username: env.BASIC_AUTH_USERNAME,
      userId: env.BASIC_AUTH_USER_ID,
    };
  }

  const header = headers.get("authorization");
  if (!header?.startsWith(AUTHORIZATION_PREFIX)) {
    return unauthorized();
  }

  const encodedCredentials = header.slice(AUTHORIZATION_PREFIX.length).trim();
  if (encodedCredentials.length === 0) {
    return unauthorized();
  }

  let decoded: string;
  try {
    decoded = Buffer.from(encodedCredentials, "base64").toString("utf8");
  } catch {
    return unauthorized();
  }

  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) {
    return unauthorized();
  }

  const username = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);

  if (
    username !== env.BASIC_AUTH_USERNAME ||
    password !== env.BASIC_AUTH_PASSWORD
  ) {
    return unauthorized();
  }

  const userId = env.BASIC_AUTH_USER_ID;

  return {
    ok: true,
    username,
    userId,
  };
}

function unauthorized(): AuthFailure {
  const response = new NextResponse("Authentication required.", {
    status: 401,
  });
  response.headers.set("WWW-Authenticate", `Basic realm="${BASIC_AUTH_REALM}"`);
  return { ok: false, response };
}
