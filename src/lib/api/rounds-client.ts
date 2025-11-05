import type { QueryKey } from "@tanstack/react-query";

import { apiClient, problemToError } from "@/lib/api/client";
import {
  type Round,
  type RoundCreate,
  RoundCreateSchema,
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
  const { data } = await apiClient.GET("/rounds", {
    params: {
      query: options.limit ? { limit: options.limit } : undefined,
    },
  });

  if (!data) {
    throw new Error("Vi mottok et ugyldig svar da rundelisten ble lastet.");
  }

  return data;
}

export async function fetchLatestRound(): Promise<Round | null> {
  const { data } = await apiClient.GET("/rounds/latest");

  if (typeof data === "undefined") {
    throw new Error("Received an invalid response when loading latest round.");
  }

  return data;
}

export async function createRound(payload: RoundCreate): Promise<void> {
  const parsedPayload = RoundCreateSchema.parse(payload);
  const { error } = await apiClient.POST("/rounds", {
    body: parsedPayload,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (error) {
    throw problemToError(error, "Kunne ikke lagre runden.");
  }
}

export async function deleteRound(roundId: string): Promise<void> {
  const { error } = await apiClient.DELETE("/rounds/{roundId}", {
    params: {
      path: {
        roundId,
      },
    },
    credentials: "include",
  });

  if (error) {
    throw problemToError(error, "Kunne ikke slette runden.");
  }
}

export type { Round } from "@/lib/api/schemas";
