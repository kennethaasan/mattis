import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { queryLeaderboard } from '../../../lib/db-client';

const querySchema = z.object({
  year: z
    .string()
    .optional()
    .refine((v) => v === undefined || /^\d{4}$/.test(v), { message: 'year must be a 4-digit number' })
    .transform((v) => (v === undefined ? undefined : Number(v))),
  limit: z
    .string()
    .optional()
    .refine((v) => v === undefined || /^[0-9]+$/.test(v), { message: 'limit must be a positive integer' })
    .transform((v) => (v === undefined ? undefined : Number(v))),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const parsed = querySchema.parse(Object.fromEntries(url.searchParams.entries()));

    const rows = await queryLeaderboard({ year: parsed.year });

    const limited = typeof parsed.limit === 'number' ? rows.slice(0, parsed.limit) : rows;

    const payload = limited.map((r) => ({
      playerId: r.player_id,
      displayName: r.display_name,
      score: r.score,
    }));

    return NextResponse.json({ data: payload }, { status: 200 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message ?? 'internal error' }, { status: 500 });
  }
}
