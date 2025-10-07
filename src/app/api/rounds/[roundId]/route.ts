import { NextRequest, NextResponse } from "next/server";

import { badRequest, createProblemResponse } from "@/lib/api/problem-details";
import { RoundUpdateSchema, uuidSchema } from "@/lib/api/schemas";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  deleteRound,
  getRoundById,
  updateRound,
} from "@/lib/db-client";

// Placeholder for authentication/user context
const getUserId = (req: NextRequest): string => {
  // In a real app, this would come from a session or token.
  // For development, we use a placeholder from the environment.
  return req.headers.get("X-User-Id") || process.env.DEV_USER_ID!;
};

export async function GET(_req: Request, context: { params: Promise<{ roundId: string }> }) {
  const { roundId } = await context.params;

  const validation = uuidSchema.safeParse(roundId);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues }, { status: 400 });
  }

  try {
    const round = await getRoundById(roundId);

    return NextResponse.json(toRoundResponse(round));
  } catch (error) {
    if (error instanceof NotFoundError) {
      return createProblemResponse({ status: 404, title: "Not Found", detail: error.message });
    }
    return createProblemResponse({ status: 500, title: "Internal Server Error", detail: "Internal Server Error" });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ roundId: string }> }) {
  const userId = getUserId(req);
  if (!userId) {
    return badRequest("Authentication required.");
  }

  const { roundId } = await context.params;

  const validation = uuidSchema.safeParse(roundId);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Malformed JSON in request body.");
  }

  const parsedBody = RoundUpdateSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: parsedBody.error.issues }, { status: 400 });
  }

  try {
    const updatedRound = await updateRound(roundId, {
      participantIds: parsedBody.data.participant_ids,
      loserId: parsedBody.data.loser_id,
    });

    return NextResponse.json(toRoundResponse(updatedRound));
  } catch (error) {
    if (error instanceof NotFoundError) {
      return createProblemResponse({ status: 404, title: "Not Found", detail: error.message });
    }
    if (error instanceof ConflictError) {
      return createProblemResponse({ status: 409, title: "Conflict", detail: error.message });
    }
    if (error instanceof ForbiddenError) {
      return createProblemResponse({ status: 403, title: "Forbidden", detail: error.message });
    }
    return createProblemResponse({ status: 500, title: "Internal Server Error", detail: "Internal Server Error" });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ roundId: string }> }) {
  const userId = getUserId(req);
  if (!userId) {
    return badRequest("Authentication required.");
  }

  const { roundId } = await context.params;

  const validation = uuidSchema.safeParse(roundId);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues }, { status: 400 });
  }

  try {
    await deleteRound(roundId);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return createProblemResponse({ status: 404, title: "Not Found", detail: error.message });
    }
    if (error instanceof ForbiddenError) {
      return createProblemResponse({ status: 403, title: "Forbidden", detail: error.message });
    }
    return createProblemResponse({ status: 500, title: "Internal Server Error", detail: "Internal Server Error" });
  }
}

function toRoundResponse(round: {
  id: string;
  createdAt: Date;
  participants: Array<{ id: string; displayName: string; active: boolean }>;
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
