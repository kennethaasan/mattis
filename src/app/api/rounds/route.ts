import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { badRequest, createProblemResponse } from "@/lib/api/problem-details";
import { toRoundResponse } from "@/lib/api/response-helpers";
import { ListQuerySchema, RoundCreateSchema } from "@/lib/api/schemas";
import { requireAuthenticatedRequest } from "@/lib/auth/authorize";
import {
  ConflictError,
  createRound,
  listRecentRounds,
  NotFoundError,
} from "@/lib/db-client";
import {
  getErrorLogContext,
  getRequestLogContext,
} from "@/lib/observability/logging";
import { logger } from "@/lib/observability/powertools";

export async function GET(req: NextRequest) {
  const requestContext = getRequestLogContext(req);
  logger.info("Received request to list rounds", requestContext);
  const { searchParams } = new URL(req.url);
  const query = Object.fromEntries(searchParams.entries());

  const validation = ListQuerySchema.safeParse(query);
  if (!validation.success) {
    const detail =
      validation.error.issues.at(0)?.message ?? "Query parameters are invalid.";
    logger.warn("Invalid query parameters for rounds list", {
      ...requestContext,
      query,
    });
    return badRequest(detail);
  }

  try {
    const rounds = await listRecentRounds({ limit: validation.data.limit });
    logger.info("Returning rounds", {
      ...requestContext,
      count: rounds.length,
      limit: validation.data.limit,
    });
    return NextResponse.json(rounds.map(toRoundResponse));
  } catch (error) {
    if (error instanceof ConflictError) {
      logger.warn("Conflict while listing rounds", {
        ...requestContext,
        error: getErrorLogContext(error),
      });
      return createProblemResponse({
        status: 409,
        title: "Conflict",
        detail: error.message,
      });
    }

    logger.error("Failed to list rounds", {
      ...requestContext,
      error: getErrorLogContext(error),
    });

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
  const requestContext = getRequestLogContext(req);
  logger.info("Received request to create round", requestContext);
  const auth = await requireAuthenticatedRequest(req.headers);
  if (!auth) {
    logger.warn("Unauthorized request to create round", requestContext);
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
    } catch (error) {
      logger.warn("Malformed JSON in rounds create request", {
        ...requestContext,
        error: getErrorLogContext(error),
        auserId: auth.user.id,
      });
      return badRequest("Malformed JSON in request body.");
    }

    const validatedData = RoundCreateSchema.safeParse(body);

    if (!validatedData.success) {
      const detail =
        validatedData.error.issues.at(0)?.message ??
        "Request body validation failed.";
      logger.warn("Validation failed for round creation", {
        ...requestContext,
        error: getErrorLogContext(validatedData.error),
        userId: auth.user.id,
      });
      return badRequest(detail);
    }

    const { participant_ids, loser_id } = validatedData.data;

    const newRound = await createRound({
      participantIds: participant_ids,
      loserId: loser_id,
      createdBy: auth.user.id,
    });

    logger.info("Round created", {
      ...requestContext,
      roundId: newRound.id,
      userId: auth.user.id,
      participantCount: participant_ids.length,
    });

    return NextResponse.json(toRoundResponse(newRound), { status: 201 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      logger.warn("Round creation failed due to missing resource", {
        ...requestContext,
        error: getErrorLogContext(error),
        userId: auth.user.id,
      });
      return createProblemResponse({
        status: 404,
        title: "Not Found",
        detail: error.message,
      });
    }

    if (error instanceof ConflictError) {
      logger.warn("Conflict while creating round", {
        ...requestContext,
        error: getErrorLogContext(error),
        userId: auth.user.id,
      });
      return createProblemResponse({
        status: 409,
        title: "Conflict",
        detail: error.message,
      });
    }

    logger.error("Failed to create round", {
      ...requestContext,
      error: getErrorLogContext(error),
      userId: auth.user.id,
    });

    return createProblemResponse({
      status: 500,
      title: "Internal Server Error",
      detail: "Internal Server Error",
    });
  }
}
