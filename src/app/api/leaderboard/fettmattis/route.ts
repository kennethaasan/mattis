import { NextResponse } from "next/server";

import { badRequest, createProblemResponse } from "@/lib/api/problem-details";
import { LeaderboardQuerySchema } from "@/lib/api/schemas";
import { getFettMattisLeaderboard } from "@/lib/db-client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = Object.fromEntries(searchParams.entries());

  const validation = LeaderboardQuerySchema.safeParse(query);

  if (!validation.success) {
    const detail =
      validation.error.issues.at(0)?.message ?? "Invalid leaderboard query.";
    return badRequest(detail);
  }

  const requestedYear = validation.data.year;
  const fallbackYear = new Date().getFullYear();
  const year = requestedYear === "all" ? null : (requestedYear ?? fallbackYear);

  try {
    const leaderboard = await getFettMattisLeaderboard(year);
    return NextResponse.json(leaderboard.map(toFettMattisResponse));
  } catch (error) {
    return createProblemResponse({
      status: 500,
      title: "Internal Server Error",
      detail: error instanceof Error ? error.message : undefined,
    });
  }
}

function toFettMattisResponse(entry: {
  rank: number;
  fettMattisCount: number;
  player: { id: string; displayName: string; active: boolean };
}) {
  return {
    rank: entry.rank,
    fettmattis_count: entry.fettMattisCount,
    player: {
      id: entry.player.id,
      display_name: entry.player.displayName,
      active: entry.player.active,
    },
  };
}
