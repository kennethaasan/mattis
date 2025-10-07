import { getFettmattisLeaderboard } from '@/lib/leaderboard';
import { NextResponse } from 'next/server';
import { LeaderboardQuerySchema } from '@/lib/api/schemas';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());

    const validation = LeaderboardQuerySchema.safeParse(query);

    if (!validation.success) {
        return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }

    const year = validation.data.year ?? new Date().getFullYear();

    try {
        const leaderboard = await getFettmattisLeaderboard(year);
        return NextResponse.json(leaderboard);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
