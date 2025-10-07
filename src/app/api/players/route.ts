import { NextResponse } from "next/server";

import { PlayerCreateSchema } from "@/lib/api/schemas";
import { createPlayer, listPlayers, ConflictError } from "@/lib/db-client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = PlayerCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }

    const { display_name } = validation.data;

    const newPlayer = await createPlayer({ displayName: display_name });

    return NextResponse.json(toPlayerResponse(newPlayer), { status: 201 });
  } catch (error) {
    if (error instanceof ConflictError) {
      return NextResponse.json(
        { type: "about:blank", title: "Conflict", status: 409, detail: error.message },
        { status: 409 },
      );
    }

    return NextResponse.json({ type: "about:blank", title: "Internal Server Error", status: 500 }, { status: 500 });
  }
}

export async function GET(_req: Request) {
  try {
    const allPlayers = await listPlayers();
    return NextResponse.json(allPlayers.map(toPlayerResponse));
  } catch (error) {
    return NextResponse.json({ type: "about:blank", title: "Internal Server Error", status: 500 }, { status: 500 });
  }
}

function toPlayerResponse(player: { id: string; displayName: string; active: boolean }) {
  return {
    id: player.id,
    display_name: player.displayName,
    active: player.active,
  };
}
