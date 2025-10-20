import type { QueryKey } from "@tanstack/react-query";

import { fetchJson, fetchWithProblemDetails } from "@/lib/api/fetch-json";
import {
  type FettMattis,
  type FettMattisCreate,
  FettMattisCreateSchema,
  FettMattisListResponseSchema,
} from "@/lib/api/schemas";

export function createFettMattisListQueryKey(limit?: number) {
  return ["fettmattis", "list", limit ?? "default"] as const satisfies QueryKey;
}

interface FetchFettMattisOptions {
  limit?: number;
}

export async function fetchFettMattis(
  options: FetchFettMattisOptions = {},
): Promise<FettMattis[]> {
  const params = new URLSearchParams();
  if (options.limit) {
    params.set("limit", options.limit.toString());
  }

  const query = params.toString();
  const url = query ? `/api/fettmattis?${query}` : "/api/fettmattis";

  return fetchJson({
    input: url,
    schema: FettMattisListResponseSchema,
    requestErrorMessage:
      "Vi klarte ikke å laste FettMattis-oversikten nå. Prøv igjen litt senere.",
    parseErrorMessage:
      "Vi mottok et ugyldig svar da FettMattis-listen ble lastet.",
  });
}

export type { FettMattis } from "@/lib/api/schemas";

export async function createFettMattis(payload: FettMattisCreate): Promise<void> {
  const parsedPayload = FettMattisCreateSchema.parse(payload);

  await fetchWithProblemDetails({
    input: "/api/fettmattis",
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(parsedPayload),
    },
    errorMessage: "Kunne ikke tildele en Fettmattis.",
  });
}

export async function revokeFettMattis(fettMattisId: string): Promise<void> {
  await fetchWithProblemDetails({
    input: `/api/fettmattis/${fettMattisId}`,
    init: {
      method: "DELETE",
      credentials: "include",
    },
    errorMessage: "Kunne ikke slette Fettmattis.",
  });
}
