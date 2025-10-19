import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { badRequest, createProblemResponse } from "@/lib/api/problem-details";
import { toRoundResponse } from "@/lib/api/response-helpers";
import { ListQuerySchema, RoundCreateSchema } from "@/lib/api/schemas";
import { resolveRequestUserId } from "@/lib/auth/request-user";
import {
  ConflictError,
  createRound,
  listRecentRounds,
  NotFoundError,
} from "@/lib/db-client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = Object.fromEntries(searchParams.entries());

  const validation = ListQuerySchema.safeParse(query);
  if (!validation.success) {
    const detail =
      validation.error.issues.at(0)?.message ?? "Query parameters are invalid.";
    return badRequest(detail);
  }

  try {
    const rounds = await listRecentRounds({ limit: validation.data.limit });
    return NextResponse.json(rounds.map(toRoundResponse));
  } catch (error) {
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

/**
 * POST /api/rounds
 * Creates a new round.
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

    const validatedData = RoundCreateSchema.safeParse(body);

    if (!validatedData.success) {
      const detail =
        validatedData.error.issues.at(0)?.message ??
        "Request body validation failed.";
      return badRequest(detail);
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
