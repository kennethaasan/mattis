import type { NextRequest } from "next/server";

import { notFound } from "@/lib/api/problem-details";
import { db } from "@/lib/db";
import { fettmattis } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * DELETE /api/fettmattis/{fettmattisId}
 * Deletes a fettmattis.
 */
export async function DELETE(_req: NextRequest, { params }: { params: { fettmattisId: string } }) {
    const deletedFettmattis = await db.delete(fettmattis).where(eq(fettmattis.id, params.fettmattisId)).returning();

    if (deletedFettmattis.length === 0) {
        return notFound("Fettmattis not found.");
    }

    return new Response(null, { status: 204 });
}
