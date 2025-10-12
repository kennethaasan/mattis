import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { finalizeResponse } from "@/lib/api/cors";
import { badRequest, createProblemResponse } from "@/lib/api/problem-details";
import { FettMattisCreateSchema } from "@/lib/api/schemas";
import { toApiFettMattis } from "@/lib/api/serializers";
import { validationErrorResponse } from "@/lib/api/validation";
import { authenticateHeaders } from "@/lib/auth/better-auth";
import {
  ConflictError,
  NotFoundError,
  createFettMattis,
} from "@/lib/db-client";

/**
 * POST /api/fettmattis
 * Creates a new fettmattis.
 */
export async function POST(req: NextRequest) {
  const authResult = authenticateHeaders(req.headers);
  if (!authResult.ok) {
    return finalizeResponse(req, authResult.response);
  }

  const userId = authResult.userId;

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return finalizeResponse(
        req,
        badRequest("Malformed JSON in request body."),
      );
    }

    const validatedData = FettMattisCreateSchema.safeParse(body);

    if (!validatedData.success) {
      return finalizeResponse(
        req,
        validationErrorResponse(validatedData.error.issues),
      );
    }

    const { player_id: playerId } = validatedData.data;

    const newFettmattis = await createFettMattis({
      playerId,
      createdBy: userId,
    });

    const response = NextResponse.json(toApiFettMattis(newFettmattis), {
      status: 201,
    });
    return finalizeResponse(req, response);
  } catch (error) {
    if (error instanceof NotFoundError) {
      const response = createProblemResponse({
        status: 404,
        title: "Not Found",
        detail: error.message,
      });
      return finalizeResponse(req, response);
    }
    if (error instanceof ConflictError) {
      const response = createProblemResponse({
        status: 409,
        title: "Conflict",
        detail: error.message,
      });
      return finalizeResponse(req, response);
    }
    const response = createProblemResponse({
      status: 500,
      title: "Internal Server Error",
      detail: "Internal Server Error",
    });
    return finalizeResponse(req, response);
  }
}
