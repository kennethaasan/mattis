import type { NextRequest } from "next/server";
import { beforeEach, expect, test, vi } from "vitest";
import { ProblemDetailsSchema } from "@/lib/api/schemas";

const mocks = vi.hoisted(() => {
  class MockNotFoundError extends Error {}
  class MockForbiddenError extends Error {}

  return {
    revokeFettmattis: vi.fn(),
    MockNotFoundError,
    MockForbiddenError,
  };
});

vi.mock("@/lib/db-client", () => ({
  revokeFettmattis: mocks.revokeFettmattis,
  NotFoundError: mocks.MockNotFoundError,
  ForbiddenError: mocks.MockForbiddenError,
}));

// Import the route under test
const { DELETE } = await import("@/app/api/fettmattis/[fettmattisId]/route");

// Helper function to create a mock NextRequest
const createMockRequest = () => {
  return {
    headers: new Headers(),
  } as unknown as NextRequest;
};

beforeEach(() => {
  mocks.revokeFettmattis.mockReset();
});

test("T014: DELETE /api/fettmattis/{fettmattisId} should return 404 if the fettmattis does not exist", async () => {
  mocks.revokeFettmattis.mockRejectedValueOnce(
    new mocks.MockNotFoundError("Fettmattis not found."),
  );

  const req = createMockRequest();
  const res = await DELETE(req, {
    params: Promise.resolve({
      fettmattisId: "00000000-0000-7000-0000-000000000005",
    }),
  });

  expect(res.status).toBe(404);
  const contentType = res.headers.get("Content-Type") ?? "";
  expect(contentType).toContain("application/problem+json");

  const body = await res.json();
  expect(() => ProblemDetailsSchema.parse(body)).not.toThrow();
  expect(body.title).toBe("Not Found");
});

test("T014: DELETE /api/fettmattis/{fettmattisId} should return 204 on success", async () => {
  mocks.revokeFettmattis.mockResolvedValueOnce(undefined);

  const req = createMockRequest();
  const res = await DELETE(req, {
    params: Promise.resolve({
      fettmattisId: "00000000-0000-7000-0000-000000000005",
    }),
  });

  expect(res.status).toBe(204);

  // Ensure the database function was called with the correct data
  expect(mocks.revokeFettmattis).toHaveBeenCalledWith(
    "00000000-0000-7000-0000-000000000005",
  );
});
