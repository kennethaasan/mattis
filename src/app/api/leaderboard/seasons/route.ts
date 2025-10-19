import { NextResponse } from "next/server";

import { createProblemResponse } from "@/lib/api/problem-details";
import { getLeaderboardSeasons } from "@/lib/db-client";

export async function GET() {
  try {
    const seasons = await getLeaderboardSeasons();
    return NextResponse.json({ seasons });
  } catch (error) {
    return createProblemResponse({
      status: 500,
      title: "Internal Server Error",
      detail: error instanceof Error ? error.message : undefined,
    });
  }
}
