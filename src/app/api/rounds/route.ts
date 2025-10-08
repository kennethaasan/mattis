import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { env } from "@/env";
import { badRequest, createProblemResponse } from "@/lib/api/problem-details";
import { RoundCreateSchema } from "@/lib/api/schemas";
import { ConflictError, NotFoundError, createRound } from "@/lib/db-client";

// Placeholder for authentication/user context
const getUserId = (req: NextRequest): string => {
  // In a real app, this would come from a session or token.
  // For development, we use a placeholder from the environment.
  return req.headers.get("X-User-Id") ?? env.DEV_USER_ID ?? "";
};

/**
 * POST /api/rounds
 * Creates a new round.
 */
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) {
    return badRequest("Authentication required.");
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Malformed JSON in request body.");
    }

    const validatedData = RoundCreateSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ error: validatedData.error.issues }, { status: 400 });
    }

    const { participant_ids, loser_id } = validatedData.data;

    const newRound = await createRound({
      participantIds: participant_ids,
      loserId: loser_id,
      createdBy: userId,
    });

    return NextResponse.json(toRoundResponse(newRound), { status: 201 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return createProblemResponse({ status: 404, title: "Not Found", detail: error.message });
    }

    if (error instanceof ConflictError) {
      return createProblemResponse({ status: 409, title: "Conflict", detail: error.message });
    }

    return createProblemResponse({ status: 500, title: "Internal Server Error", detail: "Internal Server Error" });
  }
}

function toRoundResponse(round: {
  id: string;
  createdAt: Date;
  participants: { id: string; displayName: string; active: boolean }[];
  loser: { id: string; displayName: string; active: boolean };
}) {
  return {
    id: round.id,
    created_at: round.createdAt.toISOString(),
    participants: round.participants.map(toPlayerResponse),
    loser: toPlayerResponse(round.loser),
  };
}

function toPlayerResponse(player: { id: string; displayName: string; active: boolean }) {
  return {
    id: player.id,
    display_name: player.displayName,
    active: player.active,
  };
}
