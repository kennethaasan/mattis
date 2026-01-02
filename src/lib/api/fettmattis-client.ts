import type { QueryKey } from "@tanstack/react-query";

import { apiClient, problemToError } from "@/lib/api/client";
import {
  type Fettmattis,
  type FettmattisCreate,
  FettmattisCreateSchema,
} from "@/lib/api/schemas";

export function createFettmattisListQueryKey(limit?: number) {
  return ["fettmattis", "list", limit ?? "default"] as const satisfies QueryKey;
}

interface FetchFettmattisOptions {
  limit?: number;
}

export async function fetchFettmattis(
  options: FetchFettmattisOptions = {},
): Promise<Fettmattis[]> {
  const { data } = await apiClient.GET("/fettmattis", {
    params: {
      query: options.limit ? { limit: options.limit } : undefined,
    },
  });

  if (!data) {
    throw new Error(
      "Vi mottok et ugyldig svar da Fettmattis-listen ble lastet.",
    );
  }

  return data;
}

export type { Fettmattis } from "@/lib/api/schemas";

export async function createFettmattis(
  payload: FettmattisCreate,
): Promise<void> {
  const parsedPayload = FettmattisCreateSchema.parse(payload);
  const { error } = await apiClient.POST("/fettmattis", {
    body: parsedPayload,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (error) {
    throw problemToError(error, "Kunne ikke tildele en Fettmattis.");
  }
}

export async function revokeFettmattis(fettmattisId: string): Promise<void> {
  const { error } = await apiClient.DELETE("/fettmattis/{fettmattisId}", {
    params: {
      path: {
        fettmattisId: fettmattisId,
      },
    },
    credentials: "include",
  });

  if (error) {
    throw problemToError(error, "Kunne ikke slette Fettmattis.");
  }
}
