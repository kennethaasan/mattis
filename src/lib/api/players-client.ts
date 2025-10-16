import type { QueryKey } from "@tanstack/react-query";

export interface PlayersApiRecord {
  id: string;
  display_name: string;
  active: boolean;
}

export interface PlayerUpdatePayload {
  display_name?: string;
  active?: boolean;
}

export const PLAYERS_QUERY_KEY = ["players"] as const satisfies QueryKey;

export async function fetchPlayers(): Promise<PlayersApiRecord[]> {
  const response = await fetch("/api/players", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      "We couldn't load the players right now. Please try again.",
    );
  }

  return (await response.json()) as PlayersApiRecord[];
}

export const resolvePlayerError = (payload: unknown): string | undefined => {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const candidate = payload as {
    error?: unknown;
    detail?: unknown;
  };

  if (Array.isArray(candidate.error)) {
    for (const issue of candidate.error) {
      if (
        typeof issue === "object" &&
        issue !== null &&
        "message" in issue &&
        typeof (issue as { message?: unknown }).message === "string"
      ) {
        return (issue as { message?: string }).message;
      }
    }
  }

  if (typeof candidate.detail === "string") {
    return candidate.detail;
  }

  return undefined;
};

export async function updatePlayer(
  playerId: string,
  payload: PlayerUpdatePayload,
  authHeader?: Record<string, string> | null,
): Promise<PlayersApiRecord> {
  const response = await fetch(`/api/players/${playerId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ?? {}),
    },
    body: JSON.stringify(payload),
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

  return (await response.json()) as PlayersApiRecord;
}
