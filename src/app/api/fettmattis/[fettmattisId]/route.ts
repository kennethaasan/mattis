import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { env } from "@/env";
import { badRequest, createProblemResponse } from "@/lib/api/problem-details";
import { uuidSchema } from "@/lib/api/schemas";
import { ForbiddenError, NotFoundError, revokeFettMattis } from "@/lib/db-client";

// Placeholder for authentication/user context
const getUserId = (req: NextRequest): string => {
  // In a real app, this would come from a session or token.
  // For development, we use a placeholder from the environment.
  return req.headers.get("X-User-Id") ?? env.DEV_USER_ID;
};

export async function DELETE(req: NextRequest, context: { params: Promise<{ fettmattisId: string }> }) {
  const userId = getUserId(req);
  if (!userId) {
    return badRequest("Authentication required.");
  }

  const { fettmattisId } = await context.params;

  const validation = uuidSchema.safeParse(fettmattisId);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues }, { status: 400 });
  }

  try {
    await revokeFettMattis(fettmattisId);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return createProblemResponse({ status: 404, title: "Not Found", detail: error.message });
    }
    if (error instanceof ForbiddenError) {
      return createProblemResponse({ status: 403, title: "Forbidden", detail: error.message });
    }
    return createProblemResponse({ status: 500, title: "Internal Server Error", detail: "Internal Server Error" });
  }
}
