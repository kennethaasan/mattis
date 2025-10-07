import { deleteFettMattis } from '@/lib/db/db-client';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { badRequest, createProblemResponse } from '@/lib/api/problem-details';
import { uuidSchema } from '@/lib/api/schemas';

// Placeholder for authentication/user context
const getUserId = (req: NextRequest): string => {
  // In a real app, this would come from a session or token.
  // For development, we use a placeholder from the environment.
  return req.headers.get("X-User-Id") || process.env.DEV_USER_ID!;
};

export async function DELETE(req: NextRequest, { params }: { params: { fettmattisId: string } }) {
    const userId = getUserId(req);
    if (!userId) {
        return badRequest("Authentication required.");
    }

    const validation = uuidSchema.safeParse(params.fettmattisId);
    if (!validation.success) {
        return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }

    try {
        const deletedFettmattis = await deleteFettMattis(params.fettmattisId);

        if (!deletedFettmattis) {
            return NextResponse.json({ type: 'about:blank', title: 'Not Found', status: 404, detail: 'Fettmattis not found' }, { status: 404 });
        }

        return new Response(null, { status: 204 });
    } catch (_error) {
        return createProblemResponse({ status: 500, title: "Internal Server Error", detail: "Internal Server Error" });
    }
}