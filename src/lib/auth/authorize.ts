import { APIError } from "better-auth";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";

type ResolvedSession = NonNullable<
  Awaited<ReturnType<typeof getSessionFromCookies>>
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

async function getSessionFromCookies(headers: Headers) {
  try {
    return await auth.api.getSession({
      headers,
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
  const session = await getSessionFromCookies(headers);
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
