import type { QueryKey } from "@tanstack/react-query";

import { apiClient, problemToError } from "@/lib/api/client";
import type { Player, PlayerCreate, PlayerUpdate } from "@/lib/api/schemas";
import { PlayerCreateSchema, PlayerUpdateSchema } from "@/lib/api/schemas";

export const PLAYERS_QUERY_KEY = ["players"] as const satisfies QueryKey;

export async function fetchPlayers(): Promise<Player[]> {
  const { data } = await apiClient.GET("/players");

  if (!data) {
    throw new Error("Received an invalid response when loading players.");
  }

  return data;
}

export type { Player, PlayerUpdate } from "@/lib/api/schemas";

export async function createPlayer(payload: PlayerCreate): Promise<Player> {
  const parsedPayload = PlayerCreateSchema.parse(payload);
  const { data, error } = await apiClient.POST("/players", {
    body: parsedPayload,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (error) {
    throw problemToError(error, "Kunne ikke opprette spiller");
  }

  if (!data) {
    throw new Error("Kunne ikke bekrefte den nye spilleren.");
  }

  return data;
}

export async function updatePlayer(
  playerId: string,
  update: PlayerUpdate,
): Promise<Player> {
  const parsedPayload = PlayerUpdateSchema.parse(update);
  const { data, error } = await apiClient.PUT("/players/{playerId}", {
    params: {
      path: {
        playerId,
      },
    },
    body: parsedPayload,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (error) {
    throw problemToError(error, "We couldn't update the player right now.");
  }

  if (!data) {
    throw new Error("Received an invalid response when updating the player.");
  }

  return data;
}
