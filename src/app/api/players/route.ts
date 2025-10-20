import { NextResponse } from "next/server";

import { badRequest, createProblemResponse } from "@/lib/api/problem-details";
import { toPlayerResponse } from "@/lib/api/response-helpers";
import { PlayerCreateSchema } from "@/lib/api/schemas";
import { resolveRequestUserId } from "@/lib/auth/request-user";
import { ConflictError, createPlayer, listPlayers } from "@/lib/db-client";
import {
  getErrorLogContext,
  getRequestLogContext,
} from "@/lib/observability/logging";
import { logger } from "@/lib/observability/powertools";

export async function POST(req: Request) {
  const requestContext = getRequestLogContext(req);
  logger.info("Received request to create player", requestContext);

  const userId = await resolveRequestUserId(req.headers);
  if (!userId) {
    logger.warn("Unauthorized request to create player", requestContext);
    return createProblemResponse({
      status: 401,
      title: "Unauthorized",
      detail: "Authentication required.",
    });
  }

  try {
    const body = (await req.json()) as unknown;
    const validation = PlayerCreateSchema.safeParse(body);

    if (!validation.success) {
      const detail =
        validation.error.issues.at(0)?.message ??
        "Request body validation failed.";
      logger.warn("Validation failed for player creation", {
        ...requestContext,
        error: getErrorLogContext(validation.error),
        userId,
      });
      return badRequest(detail);
    }

    const { display_name } = validation.data;

    const newPlayer = await createPlayer({
      displayName: display_name,
      userId,
    });

    logger.info("Player created", {
      ...requestContext,
      playerId: newPlayer.id,
      userId,
    });

    return NextResponse.json(toPlayerResponse(newPlayer), { status: 201 });
  } catch (error) {
    if (error instanceof ConflictError) {
      logger.warn("Conflict while creating player", {
        ...requestContext,
        error: getErrorLogContext(error),
        userId,
      });
      return createProblemResponse({
        status: 409,
        title: "Conflict",
        detail: error.message,
      });
    }

    logger.error("Failed to create player", {
      ...requestContext,
      error: getErrorLogContext(error),
      userId,
    });

    return createProblemResponse({
      status: 500,
      title: "Internal Server Error",
      detail: error instanceof Error ? error.message : undefined,
    });
  }
}

export async function GET(req: Request) {
  const requestContext = getRequestLogContext(req);
  logger.info("Received request to list players", requestContext);
  try {
    const allPlayers = await listPlayers();
    logger.info("Returning players", {
      ...requestContext,
      count: allPlayers.length,
    });
    return NextResponse.json(allPlayers.map(toPlayerResponse));
  } catch (error) {
    logger.error("Failed to list players", {
      ...requestContext,
      error: getErrorLogContext(error),
    });
    return createProblemResponse({
      status: 500,
      title: "Internal Server Error",
      detail: error instanceof Error ? error.message : undefined,
    });
  }
}
