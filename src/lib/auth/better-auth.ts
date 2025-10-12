import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { env } from "@/env";
import {
  BASIC_AUTH_PREFIX,
  createBasicToken,
  decodeBasicToken,
  extractBasicToken,
} from "@/lib/auth/credentials";

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
export const AUTHORIZATION_PREFIX = BASIC_AUTH_PREFIX;

export function enforceBetterAuth(req: NextRequest): AuthResult {
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
  const encodedCredentials = extractBasicToken(header);
  if (!encodedCredentials) {
    return unauthorized();
  }

  const decoded = decodeBasicToken(encodedCredentials.trim());
  if (!decoded) {
    return unauthorized();
  }

  const { username, password } = decoded;

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

export function buildBasicAuthorization(
  username: string,
  password: string,
): string {
  return createBasicToken(username, password);
}
