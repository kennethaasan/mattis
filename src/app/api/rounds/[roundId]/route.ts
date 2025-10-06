import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { badRequest, notFound, createProblemResponse } from "@/lib/api/problem-details";
import { RoundUpdateSchema } from "@/lib/api/schemas";
import { db } from "@/lib/db";
import { rounds } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Placeholder for authentication/user context
const getUserId = (req: NextRequest): string => {
  // In a real app, this would come from a session or token.
  // For development, we use a placeholder from the environment.
  return req.headers.get("X-User-Id") || process.env.DEV_USER_ID!;
};

/**
 * PUT /api/rounds/{roundId}
 * Updates a round.
 */
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
      const validationMessages = (validatedData.error?.issues ?? []).map((issue) => issue.message);
      return badRequest(`Invalid input: ${validationMessages.join(", ")}`);
    }

    const updatedRound = await db.update(rounds).set(validatedData.data).where(eq(rounds.id, params.roundId)).returning();

    if (updatedRound.length === 0) {
        return notFound("Round not found.");
    }

    return NextResponse.json(updatedRound[0], { status: 200 });
  } catch (_error) {
    return createProblemResponse({ status: 500, title: "Internal Server Error", detail: "Internal Server Error" });
  }
}

/**
 * DELETE /api/rounds/{roundId}
 * Deletes a round.
 */
export async function DELETE(_req: NextRequest, { params }: { params: { roundId: string } }) {
    const deletedRound = await db.delete(rounds).where(eq(rounds.id, params.roundId)).returning();

    if (deletedRound.length === 0) {
        return notFound("Round not found.");
    }

    return new Response(null, { status: 204 });
}
