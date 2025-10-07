import { NextResponse } from "next/server";

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
    return NextResponse.json({ type: "about:blank", title: "Internal Server Error", status: 500 }, { status: 500 });
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
