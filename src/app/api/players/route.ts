import { NextResponse } from "next/server";

import { badRequest, createProblemResponse } from "@/lib/api/problem-details";
import { toPlayerResponse } from "@/lib/api/response-helpers";
import { PlayerCreateSchema } from "@/lib/api/schemas";
import { requireAuthenticatedRequest } from "@/lib/auth/authorize";
import { ConflictError, createPlayer, listPlayers } from "@/lib/db-client";
import {
  getErrorLogContext,
  getRequestLogContext,
} from "@/lib/observability/logging";
import { logger } from "@/lib/observability/powertools";

export async function POST(req: Request) {
  const requestContext = getRequestLogContext(req);
  logger.info("Received request to create player", requestContext);

  const auth = await requireAuthenticatedRequest(req.headers);
  if (!auth) {
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
        userId: auth.user.id,
      });
      return badRequest(detail);
    }

    const { display_name } = validation.data;

    const newPlayer = await createPlayer({
      displayName: display_name,
      userId: auth.user.id,
    });

    logger.info("Player created", {
      ...requestContext,
      playerId: newPlayer.id,
      userId: auth.user.id,
    });

    return NextResponse.json(toPlayerResponse(newPlayer), { status: 201 });
  } catch (error) {
    if (error instanceof ConflictError) {
      logger.warn("Conflict while creating player", {
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

    logger.error("Failed to create player", {
      ...requestContext,
      error: getErrorLogContext(error),
      userId: auth.user.id,
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
