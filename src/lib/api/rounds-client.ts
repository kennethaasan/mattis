import type { QueryKey } from "@tanstack/react-query";

import { LatestRoundResponseSchema, type Round } from "@/lib/api/schemas";

export const LATEST_ROUND_QUERY_KEY = [
  "rounds",
  "latest",
] as const satisfies QueryKey;

export async function fetchLatestRound(): Promise<Round | null> {
  const response = await fetch("/api/rounds/latest", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      "We couldn't load the most recent round right now. Please try again.",
    );
  }

  const payload = (await response.json()) as unknown;
  const parsed = LatestRoundResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("Received an invalid response when loading latest round.");
  }

  return parsed.data;
}

export type { Round } from "@/lib/api/schemas";
