import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { badRequest, createProblemResponse } from "@/lib/api/problem-details";
import { toFettMattisResponse } from "@/lib/api/response-helpers";
import { FettMattisCreateSchema, ListQuerySchema } from "@/lib/api/schemas";
import { resolveRequestUserId } from "@/lib/auth/request-user";
import {
  ConflictError,
  createFettMattis,
  listRecentFettMattis,
  NotFoundError,
} from "@/lib/db-client";
import { withObservability } from "@/lib/observability/middleware";

export const GET = withObservability(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());

    const validation = ListQuerySchema.safeParse(query);
    if (!validation.success) {
      const detail =
        validation.error.issues.at(0)?.message ?? "Query parameters are invalid.";
      return badRequest(detail);
    }

    const fettMattisList = await listRecentFettMattis({
      limit: validation.data.limit,
    });
    return NextResponse.json(fettMattisList.map(toFettMattisResponse));
  },
  {
    operationName: "ListRecentFettMattis",
    onError: (error) => {
      if (error instanceof ConflictError) {
        return createProblemResponse({
          status: 409,
          title: "Conflict",
          detail: error.message,
        });
      }

      return createProblemResponse({
        status: 500,
        title: "Internal Server Error",
        detail: "Internal Server Error",
      });
    },
  },
);

/**
 * POST /api/fettmattis
 * Creates a new fettmattis.
 */
export const POST = withObservability(
  async (req: NextRequest) => {
    const userId = await resolveRequestUserId(req.headers);
    if (!userId) {
      return createProblemResponse({
        status: 401,
        title: "Unauthorized",
        detail: "Authentication required.",
      });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Malformed JSON in request body.");
    }

    const validatedData = FettMattisCreateSchema.safeParse(body);

    if (!validatedData.success) {
      const detail =
        validatedData.error.issues.at(0)?.message ??
        "Request body validation failed.";
      return badRequest(detail);
    }

    const { player_id: playerId } = validatedData.data;

    const newFettmattis = await createFettMattis({
      playerId,
      createdBy: userId,
    });

    return NextResponse.json(toFettMattisResponse(newFettmattis), {
      status: 201,
    });
  },
  {
    operationName: "CreateFettMattis",
    onError: (error) => {
      if (error instanceof NotFoundError) {
        return createProblemResponse({
          status: 404,
          title: "Not Found",
          detail: error.message,
        });
      }
      if (error instanceof ConflictError) {
        return createProblemResponse({
          status: 409,
          title: "Conflict",
          detail: error.message,
        });
      }
      return createProblemResponse({
        status: 500,
        title: "Internal Server Error",
        detail: "Internal Server Error",
      });
    },
  },
);
