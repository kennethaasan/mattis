import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { insertRound } from '@/lib/db-client';

const bodySchema = z.object({
  createdBy: z.string().uuid(),
  participantIds: z.array(z.string().uuid()).min(2),
  loserId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = bodySchema.parse(body);

    if (!parsed.participantIds.includes(parsed.loserId)) {
      return NextResponse.json({ error: 'loserId must be one of participantIds' }, { status: 400 });
    }

    const result = await insertRound({
      createdBy: parsed.createdBy,
      participantIds: parsed.participantIds,
      loserId: parsed.loserId,
    });

    if (!result) {
      return NextResponse.json({ error: 'failed to create round' }, { status: 500 });
    }

    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
