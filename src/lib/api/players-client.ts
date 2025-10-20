import type { QueryKey } from "@tanstack/react-query";
import { fetchJson, fetchWithProblemDetails, parseJsonResponse } from "./fetch-json";
import type { Player, PlayerCreate, PlayerUpdate } from "./schemas";
import {
  PlayerCreateSchema,
  PlayerSchema,
  PlayersResponseSchema,
  PlayerUpdateSchema,
} from "./schemas";

export const PLAYERS_QUERY_KEY = ["players"] as const satisfies QueryKey;

export async function fetchPlayers(): Promise<Player[]> {
  return fetchJson({
    input: "/api/players",
    schema: PlayersResponseSchema,
    requestErrorMessage:
      "We couldn't load the players right now. Please try again.",
    parseErrorMessage: "Received an invalid response when loading players.",
  });
}

export type { Player, PlayerUpdate } from "./schemas";

export async function createPlayer(payload: PlayerCreate): Promise<Player> {
  const parsedPayload = PlayerCreateSchema.parse(payload);
  const response = await fetchWithProblemDetails({
    input: "/api/players",
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(parsedPayload),
    },
    errorMessage: "Kunne ikke opprette spiller",
  });

  return parseJsonResponse(
    response,
    PlayerSchema,
    "Kunne ikke bekrefte den nye spilleren.",
  );
}

export async function updatePlayer(
  playerId: string,
  update: PlayerUpdate,
): Promise<Player> {
  const parsedPayload = PlayerUpdateSchema.parse(update);
  const response = await fetchWithProblemDetails({
    input: `/api/players/${playerId}`,
    init: {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(parsedPayload),
    },
    errorMessage: "We couldn't update the player right now.",
  });

  return parseJsonResponse(
    response,
    PlayerSchema,
    "Received an invalid response when updating the player.",
  );
}
