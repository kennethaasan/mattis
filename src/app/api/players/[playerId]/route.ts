import { NextResponse } from "next/server";
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
    return NextResponse.json(
      { error: validation.error.issues },
      { status: 400 },
    );
  }

  try {
    const player = await getPlayerById(playerId);

    return NextResponse.json(toPlayerResponse(player));
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        {
          type: "about:blank",
          title: "Not Found",
          status: 404,
          detail: error.message,
        },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { type: "about:blank", title: "Internal Server Error", status: 500 },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ playerId: string }> },
) {
  const { playerId } = await context.params;

  const validation = uuidSchema.safeParse(playerId);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues },
      { status: 400 },
    );
  }

  const userId = await resolveRequestUserId(req.headers);
  if (!userId) {
    return NextResponse.json(
      {
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Authentication required.",
      },
      { status: 401 },
    );
  }

  try {
    const body = (await req.json()) as unknown;
    const bodyValidation = PlayerUpdateSchema.safeParse(body);

    if (!bodyValidation.success) {
      return NextResponse.json(
        { error: bodyValidation.error.issues },
        { status: 400 },
      );
    }

    const { display_name, active } = bodyValidation.data;

    const updatedPlayer = await updatePlayer(playerId, {
      displayName: display_name,
      active,
    });

    return NextResponse.json(toPlayerResponse(updatedPlayer));
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        {
          type: "about:blank",
          title: "Not Found",
          status: 404,
          detail: error.message,
        },
        { status: 404 },
      );
    }
    if (error instanceof ConflictError) {
      return NextResponse.json(
        {
          type: "about:blank",
          title: "Conflict",
          status: 409,
          detail: error.message,
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { type: "about:blank", title: "Internal Server Error", status: 500 },
      { status: 500 },
    );
  }
}
