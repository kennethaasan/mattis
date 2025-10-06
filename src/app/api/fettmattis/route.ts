import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { badRequest, createProblemResponse } from "@/lib/api/problem-details";
import { FettMattisCreateSchema } from "@/lib/api/schemas";
import { insertFettMattis } from "@/lib/db-client";

// Placeholder for authentication/user context
const getUserId = (req: NextRequest): string => {
  // In a real app, this would come from a session or token.
  // For development, we use a placeholder from the environment.
  return req.headers.get("X-User-Id") || process.env.DEV_USER_ID!;
};

/**
 * POST /api/fettmattis
 * Creates a new fettmattis.
 */
export async function POST(req: NextRequest) {
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

    const validatedData = FettMattisCreateSchema.safeParse(body);

    if (!validatedData.success) {
      const validationMessages = (validatedData.error?.issues ?? []).map((issue) => issue.message);
      return badRequest(`Invalid input: ${validationMessages.join(", ")}`);
    }

    const { player_id, round_id } = validatedData.data;

    const newFettmattis = await insertFettMattis({
      playerId: player_id,
      roundId: round_id,
      createdBy: userId,
    });

    return NextResponse.json(newFettmattis, { status: 201 });
  } catch (_error) {
    return createProblemResponse({ status: 500, title: "Internal Server Error", detail: "Internal Server Error" });
  }
}