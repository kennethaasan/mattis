import createClient from "openapi-fetch";

import { withAmzContentSha256Header } from "@/lib/api/amz-content-sha256";
import type { components, paths } from "@/lib/api/generated";

export const apiClient = createClient<paths>({
  baseUrl: "/api",
  fetch: async (input, init) => {
    const hashedInit = await withAmzContentSha256Header({
      cache: "no-store",
      ...init,
    });

    return fetch(input, hashedInit);
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
