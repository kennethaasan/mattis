import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { badRequest, createProblemResponse } from "@/lib/api/problem-details";
import { toFettMattisResponse } from "@/lib/api/response-helpers";
import { FettMattisCreateSchema, ListQuerySchema } from "@/lib/api/schemas";
import { resolveRequestUserId } from "@/lib/auth/request-user";
import {
  ConflictError,
  createFettMattis,
  listRecentFettMattis,
  NotFoundError,
} from "@/lib/db-client";
import {
  getErrorLogContext,
  getRequestLogContext,
} from "@/lib/observability/logging";
import { logger } from "@/lib/observability/powertools";

export async function GET(req: NextRequest) {
  const requestContext = getRequestLogContext(req);
  logger.info("Received request to list fettmattis", requestContext);
  const { searchParams } = new URL(req.url);
  const query = Object.fromEntries(searchParams.entries());

  const validation = ListQuerySchema.safeParse(query);
  if (!validation.success) {
    const detail =
      validation.error.issues.at(0)?.message ?? "Query parameters are invalid.";
    logger.warn("Invalid query parameters for fettmattis list", {
      ...requestContext,
      query,
    });
    return badRequest(detail);
  }

  try {
    const fettMattisList = await listRecentFettMattis({
      limit: validation.data.limit,
    });
    logger.info("Returning fettmattis", {
      ...requestContext,
      count: fettMattisList.length,
      limit: validation.data.limit,
    });
    return NextResponse.json(fettMattisList.map(toFettMattisResponse));
  } catch (error) {
    if (error instanceof ConflictError) {
      logger.warn("Conflict while listing fettmattis", {
        ...requestContext,
        error: getErrorLogContext(error),
      });
      return createProblemResponse({
        status: 409,
        title: "Conflict",
        detail: error.message,
      });
    }

    logger.error("Failed to list fettmattis", {
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
 * POST /api/fettmattis
 * Creates a new fettmattis.
 */
export async function POST(req: NextRequest) {
  const requestContext = getRequestLogContext(req);
  logger.info("Received request to create fettmattis", requestContext);
  const userId = await resolveRequestUserId(req.headers);
  if (!userId) {
    logger.warn("Unauthorized request to create fettmattis", requestContext);
    return createProblemResponse({
      status: 401,
      title: "Unauthorized",
      detail: "Authentication required.",
    });
  }

  let playerId: string | undefined;
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch (error) {
      logger.warn("Malformed JSON in fettmattis create request", {
        ...requestContext,
        error: getErrorLogContext(error),
        userId,
      });
      return badRequest("Malformed JSON in request body.");
    }

    const validatedData = FettMattisCreateSchema.safeParse(body);

    if (!validatedData.success) {
      const detail =
        validatedData.error.issues.at(0)?.message ??
        "Request body validation failed.";
      logger.warn("Validation failed for fettmattis creation", {
        ...requestContext,
        error: getErrorLogContext(validatedData.error),
        userId,
      });
      return badRequest(detail);
    }

    ({ player_id: playerId } = validatedData.data);

    const newFettmattis = await createFettMattis({
      playerId,
      createdBy: userId,
    });

    logger.info("Fettmattis created", {
      ...requestContext,
      fettMattisId: newFettmattis.id,
      userId,
      playerId,
    });

    return NextResponse.json(toFettMattisResponse(newFettmattis), {
      status: 201,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      logger.warn("Fettmattis creation failed due to missing resource", {
        ...requestContext,
        error: getErrorLogContext(error),
        userId,
        playerId,
      });
      return createProblemResponse({
        status: 404,
        title: "Not Found",
        detail: error.message,
      });
    }
    if (error instanceof ConflictError) {
      logger.warn("Conflict while creating fettmattis", {
        ...requestContext,
        error: getErrorLogContext(error),
        userId,
        playerId,
      });
      return createProblemResponse({
        status: 409,
        title: "Conflict",
        detail: error.message,
      });
    }
    logger.error("Failed to create fettmattis", {
      ...requestContext,
      error: getErrorLogContext(error),
      userId,
      playerId,
    });
    return createProblemResponse({
      status: 500,
      title: "Internal Server Error",
      detail: "Internal Server Error",
    });
  }
}
