import type { QueryKey } from "@tanstack/react-query";

import { fetchJson } from "@/lib/api/fetch-json";
import {
  LatestRoundResponseSchema,
  type Round,
  RoundListResponseSchema,
} from "@/lib/api/schemas";

export const LATEST_ROUND_QUERY_KEY = [
  "rounds",
  "latest",
] as const satisfies QueryKey;

export function createRoundsListQueryKey(limit?: number) {
  return ["rounds", "list", limit ?? "default"] as const satisfies QueryKey;
}

interface FetchRoundsOptions {
  limit?: number;
}

export async function fetchRounds(
  options: FetchRoundsOptions = {},
): Promise<Round[]> {
  const params = new URLSearchParams();
  if (options.limit) {
    params.set("limit", options.limit.toString());
  }

  const query = params.toString();
  const url = query ? `/api/rounds?${query}` : "/api/rounds";

  return fetchJson({
    input: url,
    schema: RoundListResponseSchema,
    requestErrorMessage:
      "Vi klarte ikke å laste rundeoversikten nå. Prøv igjen litt senere.",
    parseErrorMessage:
      "Vi mottok et ugyldig svar da rundelisten ble lastet.",
  });
}

export async function fetchLatestRound(): Promise<Round | null> {
  return fetchJson({
    input: "/api/rounds/latest",
    schema: LatestRoundResponseSchema,
    requestErrorMessage:
      "We couldn't load the most recent round right now. Please try again.",
    parseErrorMessage:
      "Received an invalid response when loading latest round.",
  });
}

export type { Round } from "@/lib/api/schemas";
