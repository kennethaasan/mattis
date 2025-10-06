import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { insertFettMattis } from '@/lib/db-client';

const bodySchema = z.object({
  playerId: z.string().uuid(),
  roundId: z.string().uuid().optional(),
  createdBy: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = bodySchema.parse(body);

    const result = await insertFettMattis({
      playerId: parsed.playerId,
      roundId: parsed.roundId,
      createdBy: parsed.createdBy,
    });

    if (!result) {
      return NextResponse.json({ error: 'failed to create fettmattis' }, { status: 500 });
    }

    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message ?? 'internal error' }, { status: 500 });
    }
    return NextResponse.json({ error: String(err) ?? 'internal error' }, { status: 500 });
  }
}
