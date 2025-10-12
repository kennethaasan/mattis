import { NextResponse } from "next/server";

import { createProblemResponse } from "@/lib/api/problem-details";
import { toRoundResponse } from "@/lib/api/response-helpers";
import { getMostRecentRound } from "@/lib/db-client";

export async function GET() {
  try {
    const round = await getMostRecentRound();

    if (!round) {
      return NextResponse.json(null);
    }

    return NextResponse.json(toRoundResponse(round));
  } catch (error) {
    return createProblemResponse({
      status: 500,
      title: "Internal Server Error",
      detail: error instanceof Error ? error.message : undefined,
    });
  }
}
