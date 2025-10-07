import { getRoundById, updateRound, deleteRound } from '@/lib/db/db-client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { RoundUpdateSchema } from '@/lib/api/schemas';
import { NextRequest } from 'next/server';
import { badRequest, createProblemResponse } from '@/lib/api/problem-details';

// Placeholder for authentication/user context
const getUserId = (req: NextRequest): string => {
  // In a real app, this would come from a session or token.
  // For development, we use a placeholder from the environment.
  return req.headers.get("X-User-Id") || process.env.DEV_USER_ID!;
};

export async function GET(req: Request, { params }: { params: { roundId: string } }) {
  try {
    const round = await getRoundById(params.roundId);

    if (!round) {
      return NextResponse.json({ type: 'about:blank', title: 'Not Found', status: 404, detail: 'Round not found' }, { status: 404 });
    }

    return NextResponse.json(round);
  } catch (error) {
    return NextResponse.json({ type: 'about:blank', title: 'Internal Server Error', status: 500, detail: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { roundId: string } }) {
    const userId = getUserId(req);
    if (!userId) {
        return badRequest("Authentication required.");
    }

    try {
        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return badRequest("Malformed JSON in request body.");
        }

        const validatedData = RoundUpdateSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json({ error: validatedData.error.issues }, { status: 400 });
        }

        const { participant_ids, loser_id } = validatedData.data;

        const updatedRound = await updateRound(params.roundId, {
            participantIds: participant_ids,
            loserId: loser_id,
        });

        if (!updatedRound) {
            return NextResponse.json({ type: 'about:blank', title: 'Not Found', status: 404, detail: 'Round not found' }, { status: 404 });
        }

        return NextResponse.json(updatedRound, { status: 200 });
    } catch (_error) {
        return createProblemResponse({ status: 500, title: "Internal Server Error", detail: "Internal Server Error" });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { roundId: string } }) {
    const userId = getUserId(req);
    if (!userId) {
        return badRequest("Authentication required.");
    }

    try {
        const deletedRound = await deleteRound(params.roundId);

        if (!deletedRound) {
            return NextResponse.json({ type: 'about:blank', title: 'Not Found', status: 404, detail: 'Round not found' }, { status: 404 });
        }

        return new Response(null, { status: 204 });
    } catch (_error) {
        return createProblemResponse({ status: 500, title: "Internal Server Error", detail: "Internal Server Error" });
    }
}