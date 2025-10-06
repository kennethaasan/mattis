import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { badRequest, conflict, createProblemResponse } from "@/lib/api/problem-details";
import { PlayerCreateSchema } from "@/lib/api/schemas";
import { insertPlayer, listPlayers } from "@/lib/db-client";

// Placeholder for authentication/user context
const getUserId = (req: NextRequest): string => {
  // In a real app, this would come from a session or token.
  // For development, we use a placeholder from the environment.
  return req.headers.get("X-User-Id") || process.env.DEV_USER_ID!;
};

/**
 * POST /api/players
 * Creates a new player.
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

    const validatedData = PlayerCreateSchema.safeParse(body);

    if (!validatedData.success) {
      const validationMessages = (validatedData.error?.issues ?? []).map((issue) => issue.message);
      return badRequest(`Invalid input: ${validationMessages.join(", ")}`);
    }

    const { display_name } = validatedData.data;

    const newPlayer = await insertPlayer({
      displayName: display_name,
      userId: userId,
    });

    return NextResponse.json(newPlayer, { status: 201 });
  } catch (_error) {

    // PostgreSQL unique_violation error code
    if (typeof _error === "object" && _error !== null && "code" in _error) {
      const code = (_error as { code?: unknown }).code;
      if (code === "23505") {
        return conflict("A player with this display name already exists.");
      }
    }

    return createProblemResponse({ status: 500, title: "Internal Server Error", detail: "Internal Server Error" });
  }
}

/**
 * GET /api/players
 * Lists all active players.
 */
export async function GET(_req: NextRequest) {
  try {
    const players = await listPlayers();
    return NextResponse.json(players, { status: 200 });
<<<<<<< Updated upstream
  } catch {
    return createProblemResponse({ status: 500, title: "Internal Server Error", detail: "Internal Server Error" });
=======
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
>>>>>>> Stashed changes
  }
}
