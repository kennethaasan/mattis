import type { QueryKey } from "@tanstack/react-query";

import {
  type Player,
  PlayerSchema,
  PlayersResponseSchema,
  type PlayerUpdate,
  PlayerUpdateSchema,
  ProblemDetailsSchema,
} from "./schemas";

export const PLAYERS_QUERY_KEY = ["players"] as const satisfies QueryKey;

export async function fetchPlayers(): Promise<Player[]> {
  const response = await fetch("/api/players", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      "We couldn't load the players right now. Please try again.",
    );
  }

  const payload = (await response.json()) as unknown;
  const parsed = PlayersResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("Received an invalid response when loading players.");
  }

  return parsed.data;
}

export const resolvePlayerError = (payload: unknown): string | undefined => {
  const parsedProblem = ProblemDetailsSchema.safeParse(payload);

  if (parsedProblem.success) {
    return parsedProblem.data.detail;
  }

  return undefined;
};

export type { Player, PlayerUpdate } from "./schemas";

export async function updatePlayer(
  playerId: string,
  update: PlayerUpdate,
): Promise<Player> {
  const parsedPayload = PlayerUpdateSchema.parse(update);
  const response = await fetch(`/api/players/${playerId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(parsedPayload),
  });

  if (!response.ok) {
    let detail: string | undefined;
    try {
      detail = resolvePlayerError(await response.json());
    } catch {
      detail = undefined;
    }

    throw new Error(detail ?? "We couldn't update the player right now.");
  }

  const responseBody = (await response.json()) as unknown;
  const parsed = PlayerSchema.safeParse(responseBody);

  if (!parsed.success) {
    throw new Error("Received an invalid response when updating the player.");
  }

  return parsed.data;
}
