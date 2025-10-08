import { NextResponse } from "next/server";

import { createProblemResponse } from "@/lib/api/problem-details";
import { LeaderboardQuerySchema } from "@/lib/api/schemas";
import { getRegularLeaderboard } from "@/lib/db-client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = Object.fromEntries(searchParams.entries());

  const validation = LeaderboardQuerySchema.safeParse(query);

  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues }, { status: 400 });
  }

  const year = validation.data.year ?? new Date().getFullYear();

  try {
    const leaderboard = await getRegularLeaderboard(year);
    return NextResponse.json(leaderboard.map(toRegularLeaderboardResponse));
  } catch (error) {
    return createProblemResponse({
      status: 500,
      title: "Internal Server Error",
      detail: error instanceof Error ? error.message : undefined,
    });
  }
}

function toRegularLeaderboardResponse(entry: {
  rank: number;
  lossPercentage: number;
  participationCount: number;
  lossCount: number;
  player: { id: string; displayName: string; active: boolean };
}) {
  return {
    rank: entry.rank,
    loss_percentage: entry.lossPercentage,
    participation_count: entry.participationCount,
    loss_count: entry.lossCount,
    player: {
      id: entry.player.id,
      display_name: entry.player.displayName,
      active: entry.player.active,
    },
  };
}
