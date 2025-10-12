import type { QueryKey } from "@tanstack/react-query";

export interface PlayersApiRecord {
  id: string;
  display_name: string;
  active: boolean;
}

export const PLAYERS_QUERY_KEY = ["players"] as const satisfies QueryKey;

export async function fetchPlayers(
  authorization?: string,
): Promise<PlayersApiRecord[]> {
  const headers: Record<string, string> = {};
  if (authorization) {
    headers.Authorization = authorization;
  }

  const response = await fetch("/api/players", {
    cache: "no-store",
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  });

  if (!response.ok) {
    throw new Error(
      "We couldn't load the players right now. Please try again.",
    );
  }

  return (await response.json()) as PlayersApiRecord[];
}
