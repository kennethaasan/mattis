import { NextResponse } from "next/server";

/**
 * Represents an RFC 9457 Problem Details object.
 * @see https://www.rfc-editor.org/rfc/rfc9457.html
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  [key: string]: unknown;
}

/**
 * Creates a standardized Problem Details response.
 * This function intentionally sanitizes extension members so that only
 * primitive values (string|number|boolean|null) are included and standard
 * RFC fields cannot be overridden by extensions.
 */
export function createProblemResponse({
  status,
  title,
  detail,
  type = "about:blank",
  ...rest
}: Omit<ProblemDetails, 'type'> & { type?: string }): NextResponse {
  const safeType = typeof type === "string" ? type : "about:blank";
  const safeStatus = typeof status === "number" && Number.isInteger(status) ? status : 500;

  const problem: Record<string, unknown> = {
    type: safeType,
    title,
    status: safeStatus,
  };

  if (typeof detail === "string") {
    problem.detail = detail;
  }

  // Preserve instance if provided as a string
  if (typeof rest.instance === "string") {
    problem.instance = rest.instance;
  }

  // Only allow extension members with primitive values and do not allow
  // overriding of the standard RFC 9457 members.
  const rfcKeys = new Set(["type", "title", "status", "detail", "instance"]);
  for (const [k, v] of Object.entries(rest)) {
    if (rfcKeys.has(k)) continue;
    if (v === null || ["string", "number", "boolean"].includes(typeof v)) {
      problem[k] = v;
    }
  }

  return NextResponse.json(problem, {
    status: safeStatus,
    headers: {
      "Content-Type": "application/problem+json",
    },
  });
}

/**
 * Helper for common 400 Bad Request response.
 */
export function badRequest(detail: string): NextResponse {
  return createProblemResponse({
    status: 400,
    title: "Bad Request",
    detail,
  });
}

/**
 * Helper for common 404 Not Found response.
 */
export function notFound(detail: string): NextResponse {
  return createProblemResponse({
    status: 404,
    title: "Not Found",
    detail,
  });
}

/**
 * Helper for common 409 Conflict response.
 */
export function conflict(detail: string): NextResponse {
  return createProblemResponse({
    status: 409,
    title: "Conflict",
    detail,
  });
}

/**
 * Helper for common 403 Forbidden response.
 */
export function forbidden(detail: string): NextResponse {
  return createProblemResponse({
    status: 403,
    title: "Forbidden",
    detail,
  });
}

/**
 * Helper for common 410 Gone response.
 */
export function gone(detail: string): NextResponse {
  return createProblemResponse({
    status: 410,
    title: "Gone",
    detail,
  });
}

