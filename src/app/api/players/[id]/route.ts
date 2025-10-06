import { getPlayerById } from '@/lib/db/db-client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const getPlayerParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = getPlayerParamsSchema.parse(params);
    const player = await getPlayerById(id);

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json(player);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}