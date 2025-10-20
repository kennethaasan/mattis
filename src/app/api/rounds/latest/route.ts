import { NextResponse } from "next/server";

import { createProblemResponse } from "@/lib/api/problem-details";
import { toRoundResponse } from "@/lib/api/response-helpers";
import { getMostRecentRound } from "@/lib/db-client";
import { withObservability } from "@/lib/observability/middleware";

export const GET = withObservability(
  async () => {
    const round = await getMostRecentRound();

    if (!round) {
      return NextResponse.json(null);
    }

    return NextResponse.json(toRoundResponse(round));
  },
  {
    operationName: "GetMostRecentRound",
    onError: (error) =>
      createProblemResponse({
        status: 500,
        title: "Internal Server Error",
        detail: error instanceof Error ? error.message : undefined,
      }),
  },
);
