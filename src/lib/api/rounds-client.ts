import type { QueryKey } from "@tanstack/react-query";
import { z } from "zod";

import { PlayerSchema } from "@/lib/api/schemas";

export interface RoundParticipantApiRecord {
  id: string;
  display_name: string;
  active: boolean;
}

export interface RoundApiRecord {
  id: string;
  created_at: string;
  participants: RoundParticipantApiRecord[];
  loser: RoundParticipantApiRecord;
}

export const LATEST_ROUND_QUERY_KEY = [
  "rounds",
  "latest",
] as const satisfies QueryKey;

const RoundParticipantSchema = PlayerSchema.pick({
  id: true,
  display_name: true,
  active: true,
});

const LatestRoundSchema = z
  .object({
    id: z.string(),
    created_at: z.string(),
    participants: RoundParticipantSchema.array(),
    loser: RoundParticipantSchema,
  })
  .nullable();

export async function fetchLatestRound(): Promise<RoundApiRecord | null> {
  const response = await fetch("/api/rounds/latest", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      "We couldn't load the most recent round right now. Please try again.",
    );
  }

  const payload = (await response.json()) as unknown;
  const parsed = LatestRoundSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("Received an invalid response when loading latest round.");
  }

  return parsed.data;
}
