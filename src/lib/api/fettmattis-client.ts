import type { QueryKey } from "@tanstack/react-query";

import { fetchJson } from "@/lib/api/fetch-json";
import {
  type FettMattis,
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
