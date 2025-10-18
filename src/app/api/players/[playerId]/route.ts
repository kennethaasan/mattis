import { NextResponse } from "next/server";
import { badRequest, createProblemResponse } from "@/lib/api/problem-details";
import { toPlayerResponse } from "@/lib/api/response-helpers";
import { PlayerUpdateSchema, uuidSchema } from "@/lib/api/schemas";
import { resolveRequestUserId } from "@/lib/auth/request-user";
import {
  ConflictError,
  getPlayerById,
  NotFoundError,
  updatePlayer,
} from "@/lib/db-client";

export async function GET(
  _req: Request,
  context: { params: Promise<{ playerId: string }> },
) {
  const { playerId } = await context.params;

  const validation = uuidSchema.safeParse(playerId);
  if (!validation.success) {
    const detail =
      validation.error.issues.at(0)?.message ?? "Player id is invalid.";
    return badRequest(detail);
  }

  try {
    const player = await getPlayerById(playerId);

    return NextResponse.json(toPlayerResponse(player));
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
  req: Request,
  context: { params: Promise<{ playerId: string }> },
) {
  const { playerId } = await context.params;

  const validation = uuidSchema.safeParse(playerId);
  if (!validation.success) {
    const detail =
      validation.error.issues.at(0)?.message ?? "Player id is invalid.";
    return badRequest(detail);
  }

  const userId = await resolveRequestUserId(req.headers);
  if (!userId) {
    return createProblemResponse({
      status: 401,
      title: "Unauthorized",
      detail: "Authentication required.",
    });
  }

  try {
    const body = (await req.json()) as unknown;
    const bodyValidation = PlayerUpdateSchema.safeParse(body);

    if (!bodyValidation.success) {
      const detail =
        bodyValidation.error.issues.at(0)?.message ??
        "Request body validation failed.";
      return badRequest(detail);
    }

    const { display_name, active } = bodyValidation.data;

    const updatedPlayer = await updatePlayer(playerId, {
      displayName: display_name,
      active,
    });

    return NextResponse.json(toPlayerResponse(updatedPlayer));
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
