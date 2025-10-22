import createClient from "openapi-fetch";

import { withAmzContentSha256Header } from "@/lib/api/amz-content-sha256";
import type { components, paths } from "@/lib/api/generated";

export const apiClient = createClient<paths>({
  baseUrl: "/api",
  fetch: async (request: Request) => {
    const method = request.method.toUpperCase();
    const shouldHashBody = method === "POST" || method === "PUT";

    let body: BodyInit | null | undefined;
    if (shouldHashBody) {
      const clone = request.clone();
      const buffer = await clone.arrayBuffer();
      body = buffer.byteLength > 0 ? buffer : null;
    }

    const hashedInit = await withAmzContentSha256Header({
      cache: "no-store",
      method,
      headers: request.headers,
      body,
    });

    const requestInit: RequestInit = {
      ...hashedInit,
      headers: new Headers(hashedInit.headers ?? undefined),
    };

    const resolvedBody = hashedInit.body ?? body;
    if (typeof resolvedBody !== "undefined") {
      requestInit.body = resolvedBody;
    }

    return fetch(new Request(request, requestInit));
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
