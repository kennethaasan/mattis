import type { NextRequest } from "next/server";

type RequestLike = Pick<Request, "method" | "url" | "headers"> | NextRequest;

type RequestLogContext = {
  method: string;
  url: string;
  requestId?: string;
};

type ErrorLogContext = {
  name: string;
  message: string;
  stack?: string;
};

export function getRequestLogContext(request: RequestLike): RequestLogContext {
  return {
    method: request.method,
    url: request.url,
    requestId: request.headers.get("x-request-id") ?? undefined,
  };
}

export function getErrorLogContext(error: unknown): ErrorLogContext | { raw: unknown } {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { raw: error };
}
