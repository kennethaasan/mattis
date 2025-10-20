import { NextResponse } from "next/server";

import { badRequest, createProblemResponse } from "@/lib/api/problem-details";
import { LeaderboardQuerySchema } from "@/lib/api/schemas";
import { getRegularLeaderboard } from "@/lib/db-client";
import { withObservability } from "@/lib/observability/middleware";

export const GET = withObservability(
  async (req: Request) => {
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

    const leaderboard = await getRegularLeaderboard(year);
    return NextResponse.json(leaderboard.map(toRegularLeaderboardResponse));
  },
  {
    operationName: "GetRegularLeaderboard",
    onError: (error) =>
      createProblemResponse({
        status: 500,
        title: "Internal Server Error",
        detail: error instanceof Error ? error.message : undefined,
      }),
  },
);

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
