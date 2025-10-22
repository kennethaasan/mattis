import type { QueryKey } from "@tanstack/react-query";

import { apiClient, problemToError } from "@/lib/api/client";
import {
  type FettMattis,
  type FettMattisCreate,
  FettMattisCreateSchema,
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
  const { data, error } = await apiClient.GET("/fettmattis", {
    params: {
      query: options.limit ? { limit: options.limit } : undefined,
    },
  });

  if (error) {
    throw problemToError(
      error.data,
      "Vi klarte ikke å laste FettMattis-oversikten nå. Prøv igjen litt senere.",
    );
  }

  if (!data) {
    throw new Error(
      "Vi mottok et ugyldig svar da FettMattis-listen ble lastet.",
    );
  }

  return data;
}

export type { FettMattis } from "@/lib/api/schemas";

export async function createFettMattis(payload: FettMattisCreate): Promise<void> {
  const parsedPayload = FettMattisCreateSchema.parse(payload);
  const { error } = await apiClient.POST("/fettmattis", {
    body: parsedPayload,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (error) {
    throw problemToError(error.data, "Kunne ikke tildele en Fettmattis.");
  }
}

export async function revokeFettMattis(fettMattisId: string): Promise<void> {
  const { error } = await apiClient.DELETE("/fettmattis/{fettmattisId}", {
    params: {
      path: {
        fettmattisId: fettMattisId,
      },
    },
    credentials: "include",
  });

  if (error) {
    throw problemToError(error.data, "Kunne ikke slette Fettmattis.");
  }
}
