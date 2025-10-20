import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { badRequest, createProblemResponse } from "@/lib/api/problem-details";
import { toRoundResponse } from "@/lib/api/response-helpers";
import { RoundUpdateSchema, uuidSchema } from "@/lib/api/schemas";
import { requireAuthenticatedRequest } from "@/lib/auth/authorize";
import {
  ConflictError,
  deleteRound,
  ForbiddenError,
  getRoundById,
  NotFoundError,
  updateRound,
} from "@/lib/db-client";

export async function GET(
  _req: Request,
  context: { params: Promise<{ roundId: string }> }
) {
  const { roundId } = await context.params;

  const validation = uuidSchema.safeParse(roundId);
  if (!validation.success) {
    const detail =
      validation.error.issues.at(0)?.message ?? "Round id is invalid.";
    return badRequest(detail);
  }

  try {
    const round = await getRoundById(roundId);

    return NextResponse.json(toRoundResponse(round));
  } catch (error) {
    if (error instanceof NotFoundError) {
      return createProblemResponse({
        status: 404,
        title: "Not Found",
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

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ roundId: string }> }
) {
  const auth = await requireAuthenticatedRequest(req.headers);
  if (!auth) {
    return createProblemResponse({
      status: 401,
      title: "Unauthorized",
      detail: "Authentication required.",
    });
  }

  const { roundId } = await context.params;

  const validation = uuidSchema.safeParse(roundId);
  if (!validation.success) {
    const detail =
      validation.error.issues.at(0)?.message ?? "Round id is invalid.";
    return badRequest(detail);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Malformed JSON in request body.");
  }

  const parsedBody = RoundUpdateSchema.safeParse(body);
  if (!parsedBody.success) {
    const detail =
      parsedBody.error.issues.at(0)?.message ??
      "Request body validation failed.";
    return badRequest(detail);
  }

  try {
    const updatedRound = await updateRound(roundId, {
      participantIds: parsedBody.data.participant_ids,
      loserId: parsedBody.data.loser_id,
    });

    return NextResponse.json(toRoundResponse(updatedRound));
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
    if (error instanceof ForbiddenError) {
      return createProblemResponse({
        status: 403,
        title: "Forbidden",
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

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ roundId: string }> }
) {
  const auth = await requireAuthenticatedRequest(req.headers);
  if (!auth) {
    return createProblemResponse({
      status: 401,
      title: "Unauthorized",
      detail: "Authentication required.",
    });
  }

  const { roundId } = await context.params;

  const validation = uuidSchema.safeParse(roundId);
  if (!validation.success) {
    const detail =
      validation.error.issues.at(0)?.message ?? "Round id is invalid.";
    return badRequest(detail);
  }

  try {
    await deleteRound(roundId);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return createProblemResponse({
        status: 404,
        title: "Not Found",
        detail: error.message,
      });
    }
    if (error instanceof ForbiddenError) {
      return createProblemResponse({
        status: 403,
        title: "Forbidden",
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
