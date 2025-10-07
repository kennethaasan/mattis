import { getPlayerById, updatePlayer } from '@/lib/db/db-client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PlayerUpdateSchema, uuidSchema } from '@/lib/api/schemas';

export async function GET(req: Request, { params }: { params: { playerId: string } }) {
  const validation = uuidSchema.safeParse(params.playerId);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues }, { status: 400 });
  }

  try {
    const player = await getPlayerById(params.playerId);

    if (!player) {
      return NextResponse.json({ type: 'about:blank', title: 'Not Found', status: 404, detail: 'Player not found' }, { status: 404 });
    }

    const response = {
      ...player,
      display_name: player.displayName,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ type: 'about:blank', title: 'Internal Server Error', status: 500, detail: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { playerId: string } }) {
    const validation = uuidSchema.safeParse(params.playerId);
    if (!validation.success) {
        return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }

    try {
        const body = await req.json();
        const validation = PlayerUpdateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const { display_name, active } = validation.data;

        const updatedPlayer = await updatePlayer(params.playerId, {
            displayName: display_name,
            active: active,
        });

        if (!updatedPlayer) {
            return NextResponse.json({ type: 'about:blank', title: 'Not Found', status: 404, detail: 'Player not found' }, { status: 404 });
        }

        const response = {
            ...updatedPlayer,
            display_name: updatedPlayer.displayName,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        // Add more specific error handling for database errors if needed
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}