import { type NextRequest,NextResponse } from "next/server";

import { badRequest, createProblemResponse, notFound } from "@/lib/api/problem-details";
import { getPlayerById } from "@/lib/db-client";

export async function GET(_req: NextRequest, { params }: { params: { id?: string } }) {
  const id = params?.id;
  if (!id || typeof id !== "string") {
    return badRequest("Player id is required.");
  }

  try {
    const player = await getPlayerById(id);

    if (player === null) {
      return notFound("Player not found.");
    }

    return NextResponse.json(player, { status: 200 });
  } catch {
    return createProblemResponse({
      status: 500,
      title: "Internal Server Error",
      detail: "Failed to fetch player.",
    });
  }
}
