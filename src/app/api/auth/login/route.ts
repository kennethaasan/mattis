import { NextResponse } from "next/server";

import { finalizeResponse } from "@/lib/api/cors";
import { authenticateHeaders } from "@/lib/auth/better-auth";

export function POST(req: Request) {
  const authResult = authenticateHeaders(req.headers);
  if (!authResult.ok) {
    return finalizeResponse(req, authResult.response);
  }

  const response = NextResponse.json({
    user: {
      id: authResult.userId,
      username: authResult.username,
    },
  });

  return finalizeResponse(req, response);
}
