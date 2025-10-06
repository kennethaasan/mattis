import { listPlayers, insertPlayer } from '@/lib/db/db-client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PlayerCreateSchema } from '@/lib/api/schemas';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { display_name } = PlayerCreateSchema.parse(body);

    const newPlayer = await insertPlayer({ displayName: display_name });

    const response = {
      ...newPlayer,
      display_name: newPlayer.displayName,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    // Add more specific error handling for database errors if needed
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const allPlayers = await listPlayers();
    const response = allPlayers.map((player) => ({
      ...player,
      display_name: player.displayName,
    }));
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}