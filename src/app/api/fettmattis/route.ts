import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { badRequest, createProblemResponse } from "@/lib/api/problem-details";
import { FettMattisCreateSchema } from "@/lib/api/schemas";
import { ConflictError, NotFoundError, createFettMattis } from "@/lib/db-client";

// Placeholder for authentication/user context
const getUserId = (req: NextRequest): string => {
  // In a real app, this would come from a session or token.
  // For development, we use a placeholder from the environment.
  return req.headers.get("X-User-Id") || process.env.DEV_USER_ID!;
};

/**
 * POST /api/fettmattis
 * Creates a new fettmattis.
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

    const validatedData = FettMattisCreateSchema.safeParse(body);

    if (!validatedData.success) {
      const validationMessages = (validatedData.error?.issues ?? []).map((issue) => issue.message);
      return badRequest(`Invalid input: ${validationMessages.join(", ")}`);
    }

    const { player_id: playerId, round_id: roundId } = validatedData.data;

    const newFettmattis = await createFettMattis({
      playerId,
      roundId,
      createdBy: userId,
    });

    return NextResponse.json(toFettMattisResponse(newFettmattis), { status: 201 });
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

function toFettMattisResponse(record: {
  id: string;
  player: { id: string; displayName: string; active: boolean };
  roundId: string | null;
  createdAt: Date;
}) {
  return {
    id: record.id,
    player: toPlayerResponse(record.player),
    round_id: record.roundId,
    created_at: record.createdAt.toISOString(),
  };
}

function toPlayerResponse(player: { id: string; displayName: string; active: boolean }) {
  return {
    id: player.id,
    display_name: player.displayName,
    active: player.active,
  };
}
