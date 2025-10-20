import type { ZodTypeAny, z } from "zod";

import { withAmzContentSha256Header } from "@/lib/api/amz-content-sha256";
import { ProblemDetailsSchema } from "@/lib/api/schemas";

interface FetchJsonOptions<TSchema extends ZodTypeAny> {
  input: RequestInfo | URL;
  init?: RequestInit;
  schema: TSchema;
  requestErrorMessage: string;
  parseErrorMessage: string;
}

export async function fetchJson<TSchema extends ZodTypeAny>(
  options: FetchJsonOptions<TSchema>,
): Promise<z.infer<TSchema>> {
  const init = await withAmzContentSha256Header({
    cache: "no-store",
    ...options.init,
  });

  const response = await fetch(options.input, init);

  if (!response.ok) {
    throw new Error(options.requestErrorMessage);
  }

  return parseJsonResponse(response, options.schema, options.parseErrorMessage);
}

interface FetchWithProblemDetailsOptions {
  input: RequestInfo | URL;
  init?: RequestInit;
  errorMessage: string;
}

export async function fetchWithProblemDetails({
  input,
  init,
  errorMessage,
}: FetchWithProblemDetailsOptions): Promise<Response> {
  const signedInit = await withAmzContentSha256Header({
    cache: "no-store",
    ...init,
  });

  const response = await fetch(input, signedInit);

  if (!response.ok) {
    let detail: string | undefined;

    const contentType = response.headers.get("content-type");
    const hasJsonPayload =
      typeof contentType === "string" && contentType.includes("json");

    if (hasJsonPayload) {
      try {
        const payload = (await response.json()) as unknown;
        const parsed = ProblemDetailsSchema.safeParse(payload);
        if (parsed.success) {
          detail = parsed.data.detail;
        }
      } catch {
        detail = undefined;
      }
    }

    throw new Error(detail ?? errorMessage);
  }

  return response;
}

export async function parseJsonResponse<TSchema extends ZodTypeAny>(
  response: Response,
  schema: TSchema,
  parseErrorMessage: string,
): Promise<z.infer<TSchema>> {
  const payload = (await response.json()) as unknown;
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(parseErrorMessage);
  }

  return parsed.data;
}
