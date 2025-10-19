import { fetchJson } from "@/lib/api/fetch-json";
import {
  FettmattisLeaderboardResponseSchema,
  LeaderboardSeasonsResponseSchema,
  RegularLeaderboardResponseSchema,
} from "@/lib/api/schemas";
import type {
  FettmattisLeaderboard,
  LeaderboardScope,
  RegularLeaderboard,
} from "@/lib/leaderboard-types";

function createQuery(scope: LeaderboardScope) {
  const params = new URLSearchParams();
  if (scope === "all") {
    params.set("year", "all");
  } else {
    params.set("year", scope.toString());
  }
  return params;
}

export async function getRegularLeaderboard(
  scope: LeaderboardScope,
): Promise<RegularLeaderboard> {
  const query = createQuery(scope);
  const response = await fetch(`/api/leaderboard/regular?${query.toString()}`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load regular leaderboard.");
  }

  const payload = (await response.json()) as unknown;
  const parsed = RegularLeaderboardResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("Received an invalid response when loading the leaderboard.");
  }

  return parsed.data.map((entry, index) => ({
    playerId: entry.player.id,
    playerName: entry.player.display_name,
    roundsPlayed: entry.participation_count,
    totalLosses: entry.loss_count,
    lossPercentage: entry.loss_percentage,
    rank: entry.rank ?? index + 1,
  }));
}

export async function getFettmattisLeaderboard(
  scope: LeaderboardScope,
): Promise<FettmattisLeaderboard> {
  const query = createQuery(scope);
  const response = await fetch(
    `/api/leaderboard/fettmattis?${query.toString()}`,
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to load Fettmattis leaderboard.");
  }

  const payload = (await response.json()) as unknown;
  const parsed = FettmattisLeaderboardResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("Received an invalid response when loading the leaderboard.");
  }

  return parsed.data.map((entry, index) => ({
    playerId: entry.player.id,
    playerName: entry.player.display_name,
    fettmattisCount: entry.fettmattis_count,
    rank: entry.rank ?? index + 1,
  }));
}

export async function getLeaderboardSeasons(): Promise<number[]> {
  const payload = await fetchJson({
    input: `/api/leaderboard/seasons`,
    init: {
      credentials: "include",
    },
    schema: LeaderboardSeasonsResponseSchema,
    requestErrorMessage: "Failed to load leaderboard seasons.",
    parseErrorMessage:
      "Received an invalid response when loading leaderboard seasons.",
  });

  return payload.seasons;
}
