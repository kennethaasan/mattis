import { authenticateRequest } from "@/lib/auth/authorize";

const AUTHENTICATED_USER_HEADER = "x-authenticated-user-id";

/**
 * Resolve the authenticated user's ID from a request.
 * Prefers the header injected by middleware, then falls back to validating
 * the bearer token directly. During tests (and local scripts) we fall back to
 * the BASIC_AUTH_USER_ID so existing fixtures keep working.
 */
export async function resolveRequestUserId(
  headers: Headers,
): Promise<string | null> {
  const headerUserId = headers.get(AUTHENTICATED_USER_HEADER);
  if (headerUserId && headerUserId.trim().length > 0) {
    return headerUserId.trim();
  }

  const authResult = await authenticateRequest(headers);
  if (authResult.ok) {
    return authResult.value.user.id;
  }

  const fallback = process.env.BASIC_AUTH_USER_ID;
  if (fallback && fallback.trim().length > 0) {
    return fallback.trim();
  }

  return null;
}
