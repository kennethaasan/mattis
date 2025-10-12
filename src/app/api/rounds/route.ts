import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { finalizeResponse } from "@/lib/api/cors";
import { badRequest, createProblemResponse } from "@/lib/api/problem-details";
import { RoundCreateSchema } from "@/lib/api/schemas";
import { toApiRound } from "@/lib/api/serializers";
import { validationErrorResponse } from "@/lib/api/validation";
import { authenticateHeaders } from "@/lib/auth/better-auth";
import { ConflictError, NotFoundError, createRound } from "@/lib/db-client";

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
    return finalizeResponse(req, authResult.response);
  }

  const userId = getUserId(req, authResult.userId);

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return finalizeResponse(
        req,
        badRequest("Malformed JSON in request body."),
      );
    }

    const validatedData = RoundCreateSchema.safeParse(body);

    if (!validatedData.success) {
      return finalizeResponse(
        req,
        validationErrorResponse(validatedData.error.issues),
      );
    }

    const { participant_ids, loser_id } = validatedData.data;

    const newRound = await createRound({
      participantIds: participant_ids,
      loserId: loser_id,
      createdBy: userId,
    });

    const response = NextResponse.json(toApiRound(newRound), {
      status: 201,
    });
    return finalizeResponse(req, response);
  } catch (error) {
    if (error instanceof NotFoundError) {
      const response = createProblemResponse({
        status: 404,
        title: "Not Found",
        detail: error.message,
      });
      return finalizeResponse(req, response);
    }

    if (error instanceof ConflictError) {
      const response = createProblemResponse({
        status: 409,
        title: "Conflict",
        detail: error.message,
      });
      return finalizeResponse(req, response);
    }

    const response = createProblemResponse({
      status: 500,
      title: "Internal Server Error",
      detail: "Internal Server Error",
    });
    return finalizeResponse(req, response);
  }
}
