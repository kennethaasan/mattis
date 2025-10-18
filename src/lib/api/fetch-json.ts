import type { ZodTypeAny, z } from "zod";

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
  const response = await fetch(options.input, {
    cache: "no-store",
    ...options.init,
  });

  if (!response.ok) {
    throw new Error(options.requestErrorMessage);
  }

  return parseJsonResponse(response, options.schema, options.parseErrorMessage);
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
