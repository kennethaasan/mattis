import { NextResponse } from "next/server";

import { createProblemResponse } from "@/lib/api/problem-details";
import { getLeaderboardSeasons } from "@/lib/db-client";
import { withObservability } from "@/lib/observability/middleware";

export const GET = withObservability(
  async () => {
    const seasons = await getLeaderboardSeasons();
    return NextResponse.json({ seasons });
  },
  {
    operationName: "GetLeaderboardSeasons",
    onError: (error) =>
      createProblemResponse({
        status: 500,
        title: "Internal Server Error",
        detail: error instanceof Error ? error.message : undefined,
      }),
  },
);
