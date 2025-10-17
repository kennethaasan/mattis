import { NextResponse } from "next/server";

import { badRequest, createProblemResponse } from "@/lib/api/problem-details";
import { toPlayerResponse } from "@/lib/api/response-helpers";
import { PlayerCreateSchema } from "@/lib/api/schemas";
import { resolveRequestUserId } from "@/lib/auth/request-user";
import { ConflictError, createPlayer, listPlayers } from "@/lib/db-client";

export async function POST(req: Request) {
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
    const validation = PlayerCreateSchema.safeParse(body);

    if (!validation.success) {
      const detail =
        validation.error.issues.at(0)?.message ??
        "Request body validation failed.";
      return badRequest(detail);
    }

    const { display_name } = validation.data;

    const newPlayer = await createPlayer({
      displayName: display_name,
      userId,
    });

    return NextResponse.json(toPlayerResponse(newPlayer), { status: 201 });
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
      detail: error instanceof Error ? error.message : undefined,
    });
  }
}

export async function GET(_req: Request) {
  try {
    const allPlayers = await listPlayers();
    return NextResponse.json(allPlayers.map(toPlayerResponse));
  } catch (error) {
    return createProblemResponse({
      status: 500,
      title: "Internal Server Error",
      detail: error instanceof Error ? error.message : undefined,
    });
  }
}
