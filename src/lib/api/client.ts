import createClient from "openapi-fetch";

import { withAmzContentSha256Request } from "@/lib/api/amz-content-sha256";
import type { components, paths } from "@/lib/api/generated";

export const apiClient = createClient<paths>({
  baseUrl: "/api",
  fetch: async (request: Request) => {
    const signedRequest = await withAmzContentSha256Request(request);
    return fetch(signedRequest);
  },
});

export type Problem = components["schemas"]["Problem"];

export function resolveProblemDetail(problem: Problem | undefined): string | undefined {
  const detail = problem?.detail;
  if (typeof detail !== "string") {
    return undefined;
  }

  const trimmed = detail.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function problemToError(
  problem: Problem | undefined,
  fallbackMessage: string,
): Error {
  return new Error(resolveProblemDetail(problem) ?? fallbackMessage);
}
