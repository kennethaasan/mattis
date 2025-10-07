import type { FettmattisLeaderboard, RegularLeaderboard } from "@/lib/leaderboard-types";

interface RegularLeaderboardResponse {
  rank: number;
  loss_percentage: number;
  participation_count: number;
  loss_count: number;
  player: {
    id: string;
    display_name: string;
    active: boolean;
  };
}

interface FettMattisLeaderboardResponse {
  rank: number;
  fettmattis_count: number;
  player: {
    id: string;
    display_name: string;
    active: boolean;
  };
}

export async function getRegularLeaderboard(year: number): Promise<RegularLeaderboard> {
  const response = await fetch(`/api/leaderboard/regular?year=${year}`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load regular leaderboard.");
  }

  const data = (await response.json()) as RegularLeaderboardResponse[];

  return data.map((entry, index) => ({
    playerId: entry.player.id,
    playerName: entry.player.display_name,
    roundsPlayed: entry.participation_count,
    totalLosses: entry.loss_count,
    lossPercentage: entry.loss_percentage,
    rank: entry.rank ?? index + 1,
  }));
}

export async function getFettmattisLeaderboard(year: number): Promise<FettmattisLeaderboard> {
  const response = await fetch(`/api/leaderboard/fettmattis?year=${year}`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load FettMattis leaderboard.");
  }

  const data = (await response.json()) as FettMattisLeaderboardResponse[];

  return data.map((entry, index) => ({
    playerId: entry.player.id,
    playerName: entry.player.display_name,
    fettmattisCount: entry.fettmattis_count,
    rank: entry.rank ?? index + 1,
  }));
}
