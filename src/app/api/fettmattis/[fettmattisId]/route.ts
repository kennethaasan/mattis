import type { NextRequest } from "next/server";
import { badRequest, createProblemResponse } from "@/lib/api/problem-details";
import { uuidSchema } from "@/lib/api/schemas";
import { resolveRequestUserId } from "@/lib/auth/request-user";
import {
  ForbiddenError,
  NotFoundError,
  revokeFettMattis,
} from "@/lib/db-client";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ fettmattisId: string }> }
) {
  const userId = await resolveRequestUserId(req.headers);
  if (!userId) {
    return createProblemResponse({
      status: 401,
      title: "Unauthorized",
      detail: "Authentication required.",
    });
  }

  const { fettmattisId } = await context.params;

  const validation = uuidSchema.safeParse(fettmattisId);
  if (!validation.success) {
    const detail =
      validation.error.issues.at(0)?.message ?? "Fettmattis id is invalid.";
    return badRequest(detail);
  }

  try {
    await revokeFettMattis(fettmattisId);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return createProblemResponse({
        status: 404,
        title: "Not Found",
        detail: error.message,
      });
    }
    if (error instanceof ForbiddenError) {
      return createProblemResponse({
        status: 403,
        title: "Forbidden",
        detail: error.message,
      });
    }
    return createProblemResponse({
      status: 500,
      title: "Internal Server Error",
      detail: "Internal Server Error",
    });
  }
}
