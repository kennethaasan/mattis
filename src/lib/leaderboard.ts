import { apiClient, problemToError } from "@/lib/api/client";
import type {
  FettmattisLeaderboard,
  LeaderboardScope,
  RegularLeaderboard,
} from "@/lib/leaderboard-types";

function createQuery(scope: LeaderboardScope) {
  if (scope === "all") {
    return { year: "all" as const };
  }

  return { year: scope };
}

export async function getRegularLeaderboard(
  scope: LeaderboardScope,
): Promise<RegularLeaderboard> {
  const { data, error } = await apiClient.GET("/leaderboard/regular", {
    params: {
      query: createQuery(scope),
    },
    credentials: "include",
  });

  if (error) {
    throw problemToError(
      error.data,
      "Failed to load regular leaderboard.",
    );
  }

  if (!data) {
    throw new Error(
      "Received an invalid response when loading the leaderboard.",
    );
  }

  return data.map((entry, index) => ({
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
  const { data, error } = await apiClient.GET("/leaderboard/fettmattis", {
    params: {
      query: createQuery(scope),
    },
    credentials: "include",
  });

  if (error) {
    throw problemToError(
      error.data,
      "Failed to load Fettmattis leaderboard.",
    );
  }

  if (!data) {
    throw new Error(
      "Received an invalid response when loading the leaderboard.",
    );
  }

  return data.map((entry, index) => ({
    playerId: entry.player.id,
    playerName: entry.player.display_name,
    fettmattisCount: entry.fettmattis_count,
    rank: entry.rank ?? index + 1,
  }));
}

export async function getLeaderboardSeasons(): Promise<number[]> {
  const { data, error } = await apiClient.GET("/leaderboard/seasons", {
    credentials: "include",
  });

  if (error) {
    throw problemToError(
      error.data,
      "Failed to load leaderboard seasons.",
    );
  }

  if (!data) {
    throw new Error(
      "Received an invalid response when loading leaderboard seasons.",
    );
  }

  return data.seasons;
}
