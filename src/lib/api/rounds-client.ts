import type { QueryKey } from "@tanstack/react-query";

import { fetchJson } from "@/lib/api/fetch-json";
import { LatestRoundResponseSchema, type Round } from "@/lib/api/schemas";

export const LATEST_ROUND_QUERY_KEY = [
  "rounds",
  "latest",
] as const satisfies QueryKey;

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
