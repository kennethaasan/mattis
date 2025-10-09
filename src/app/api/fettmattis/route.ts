import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { env } from "@/env";
import { badRequest, createProblemResponse } from "@/lib/api/problem-details";
import { FettMattisCreateSchema } from "@/lib/api/schemas";
import { authenticateHeaders } from "@/lib/auth/basic-auth";
import {
  ConflictError,
  NotFoundError,
  createFettMattis,
} from "@/lib/db-client";

const getUserId = (req: NextRequest, fallbackUserId: string): string => {
  return (
    req.headers.get("x-authenticated-user-id") ??
    req.headers.get("x-user-id") ??
    fallbackUserId ??
    env.BASIC_AUTH_USER_ID ??
    env.DEV_USER_ID
  );
};

/**
 * POST /api/fettmattis
 * Creates a new fettmattis.
 */
export async function POST(req: NextRequest) {
  const authResult = authenticateHeaders(req.headers);
  if (!authResult.ok) {
    return authResult.response;
  }

  const userId = getUserId(req, authResult.userId);

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Malformed JSON in request body.");
    }

    const validatedData = FettMattisCreateSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.issues },
        { status: 400 },
      );
    }

    const { player_id: playerId, round_id: roundId } = validatedData.data;

    const newFettmattis = await createFettMattis({
      playerId,
      roundId,
      createdBy: userId,
    });

    return NextResponse.json(toFettMattisResponse(newFettmattis), {
      status: 201,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return createProblemResponse({
        status: 404,
        title: "Not Found",
        detail: error.message,
      });
    }
    if (error instanceof ConflictError) {
      return createProblemResponse({
        status: 409,
        title: "Conflict",
        detail: error.message,
      });
    }
    return createProblemResponse({
      status: 500,
      title: "Internal Server Error",
      detail: "Internal Server Error",
    });
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

function toPlayerResponse(player: {
  id: string;
  displayName: string;
  active: boolean;
}) {
  return {
    id: player.id,
    display_name: player.displayName,
    active: player.active,
  };
}
