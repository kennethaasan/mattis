import { NextResponse } from "next/server";

import { finalizeResponse } from "@/lib/api/cors";
import { createProblemResponse } from "@/lib/api/problem-details";
import { PlayerCreateSchema } from "@/lib/api/schemas";
import { toApiPlayer } from "@/lib/api/serializers";
import { validationErrorResponse } from "@/lib/api/validation";
import { authenticateHeaders } from "@/lib/auth/better-auth";
import { createPlayer, listPlayers, ConflictError } from "@/lib/db-client";

export async function POST(req: Request) {
  const authResult = authenticateHeaders(req.headers);
  if (!authResult.ok) {
    return finalizeResponse(req, authResult.response);
  }

  try {
    const body = (await req.json()) as unknown;
    const validation = PlayerCreateSchema.safeParse(body);

    if (!validation.success) {
      return finalizeResponse(
        req,
        validationErrorResponse(validation.error.issues),
      );
    }

    const { display_name } = validation.data;

    const newPlayer = await createPlayer({ displayName: display_name });

    const response = NextResponse.json(toApiPlayer(newPlayer), {
      status: 201,
    });
    return finalizeResponse(req, response);
  } catch (error) {
    if (error instanceof ConflictError) {
      const response = NextResponse.json(
        {
          type: "about:blank",
          title: "Conflict",
          status: 409,
          detail: error.message,
        },
        { status: 409 },
      );
      return finalizeResponse(req, response);
    }

    const response = createProblemResponse({
      status: 500,
      title: "Internal Server Error",
      detail: error instanceof Error ? error.message : undefined,
    });
    return finalizeResponse(req, response);
  }
}

export async function GET(req: Request) {
  const authResult = authenticateHeaders(req.headers);
  if (!authResult.ok) {
    return finalizeResponse(req, authResult.response);
  }

  try {
    const allPlayers = await listPlayers();
    return finalizeResponse(
      req,
      NextResponse.json(allPlayers.map(toApiPlayer)),
    );
  } catch (error) {
    const response = createProblemResponse({
      status: 500,
      title: "Internal Server Error",
      detail: error instanceof Error ? error.message : undefined,
    });
    return finalizeResponse(req, response);
  }
}
