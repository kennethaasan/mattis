import { APIError } from "better-auth";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";

const AUTHORIZATION_PREFIX = "Bearer ";

type ResolvedSession = NonNullable<
  Awaited<ReturnType<typeof getSessionForToken>>
>;

export interface AuthenticatedUser {
  readonly session: ResolvedSession["session"];
  readonly user: ResolvedSession["user"];
}

export interface AuthSuccess {
  ok: true;
  value: AuthenticatedUser;
}

export interface AuthFailure {
  ok: false;
  response: NextResponse;
}

export type AuthResult = AuthSuccess | AuthFailure;

function createAuthorizationHeaders(token: string): Headers {
  return new Headers({
    authorization: `${AUTHORIZATION_PREFIX}${token}`,
  });
}

async function getSessionForToken(token: string) {
  try {
    return await auth.api.getSession({
      headers: createAuthorizationHeaders(token),
      query: {
        disableRefresh: true,
      },
    });
  } catch (error) {
    if (error instanceof APIError) {
      return null;
    }

    throw error;
  }
}

function unauthorizedResponse(): NextResponse {
  return new NextResponse("Authentication required.", {
    status: 401,
  });
}

export async function authenticateRequest(
  headers: Headers
): Promise<AuthResult> {
  const header = headers.get("authorization");
  if (!header?.startsWith(AUTHORIZATION_PREFIX)) {
    return { ok: false, response: unauthorizedResponse() };
  }

  const token = header.slice(AUTHORIZATION_PREFIX.length).trim();
  if (!token) {
    return { ok: false, response: unauthorizedResponse() };
  }

  const session = await getSessionForToken(token);
  if (!session) {
    return { ok: false, response: unauthorizedResponse() };
  }

  return {
    ok: true,
    value: session,
  };
}

export async function requireAuthenticatedRequest(
  headers: Headers
): Promise<AuthenticatedUser> {
  const result = await authenticateRequest(headers);
  if (!result.ok) {
    throw result.response;
  }
  return result.value;
}
