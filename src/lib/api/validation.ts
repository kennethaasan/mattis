import { NextResponse } from "next/server";

export function validationErrorResponse(
  issues: readonly unknown[],
): NextResponse {
  return NextResponse.json(
    { error: issues },
    {
      status: 400,
    },
  );
}
