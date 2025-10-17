import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { badRequest, createProblemResponse } from "@/lib/api/problem-details";
import { toPlayerResponse } from "@/lib/api/response-helpers";
import { FettMattisCreateSchema } from "@/lib/api/schemas";
import { resolveRequestUserId } from "@/lib/auth/request-user";
import {
  ConflictError,
  createFettMattis,
  NotFoundError,
} from "@/lib/db-client";

/**
 * POST /api/fettmattis
 * Creates a new fettmattis.
 */
export async function POST(req: NextRequest) {
  const userId = await resolveRequestUserId(req.headers);
  if (!userId) {
    return createProblemResponse({
      status: 401,
      title: "Unauthorized",
      detail: "Authentication required.",
    });
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
      const detail =
        validatedData.error.issues.at(0)?.message ??
        "Request body validation failed.";
      return badRequest(detail);
    }

    const { player_id: playerId } = validatedData.data;

    const newFettmattis = await createFettMattis({
      playerId,
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
  createdAt: Date;
}) {
  return {
    id: record.id,
    player: toPlayerResponse(record.player),
    created_at: record.createdAt.toISOString(),
  };
}
