import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { badRequest, createProblemResponse } from "@/lib/api/problem-details";
import { toRoundResponse } from "@/lib/api/response-helpers";
import { RoundCreateSchema } from "@/lib/api/schemas";
import { authenticateHeaders } from "@/lib/auth/basic-auth";
import { ConflictError, createRound, NotFoundError } from "@/lib/db-client";

const getUserId = (req: NextRequest, fallbackUserId: string): string => {
  const headerUserId =
    req.headers.get("x-authenticated-user-id") ?? req.headers.get("x-user-id");

  return headerUserId ?? fallbackUserId;
};

/**
 * POST /api/rounds
 * Creates a new round.
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

    const validatedData = RoundCreateSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.issues },
        { status: 400 },
      );
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
