import { test, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { ProblemDetailsSchema } from "@/lib/api/schemas";

const mocks = vi.hoisted(() => {
  class MockNotFoundError extends Error {}
  class MockForbiddenError extends Error {}

  return {
    deleteRound: vi.fn(),
    MockNotFoundError,
    MockForbiddenError,
  };
});

vi.mock("@/lib/db-client", () => ({
  deleteRound: mocks.deleteRound,
  NotFoundError: mocks.MockNotFoundError,
  ForbiddenError: mocks.MockForbiddenError,
}));

// Import the route under test
const { DELETE } = await import("@/app/api/rounds/[roundId]/route");

// Mock the environment variable for the user ID
const MOCK_USER_ID = "00000000-0000-7000-0000-000000000000";
vi.stubEnv("DEV_USER_ID", MOCK_USER_ID);

// Helper function to create a mock NextRequest
const createMockRequest = () => {
  return {
    headers: new Headers({ "X-User-Id": MOCK_USER_ID }),
  } as unknown as NextRequest;
};

beforeEach(() => {
  mocks.deleteRound.mockReset();
});

test("T012: DELETE /api/rounds/{roundId} should return 404 if the round does not exist", async () => {
  mocks.deleteRound.mockRejectedValueOnce(new mocks.MockNotFoundError("Round not found."));

  const req = createMockRequest();
  const res = await DELETE(req, { params: Promise.resolve({ roundId: "00000000-0000-7000-0000-000000000004" }) });

  expect(res.status).toBe(404);
  expect(String(res.headers.get("Content-Type") || "")).toContain("application/problem+json");

  const body = await res.json();
  expect(() => ProblemDetailsSchema.parse(body)).not.toThrow();
  expect(body.title).toBe("Not Found");
});

test("T012: DELETE /api/rounds/{roundId} should return 204 on success", async () => {
  mocks.deleteRound.mockResolvedValueOnce(undefined);

  const req = createMockRequest();
  const res = await DELETE(req, { params: Promise.resolve({ roundId: "00000000-0000-7000-0000-000000000004" }) });

  expect(res.status).toBe(204);

  // Ensure the database function was called with the correct data
  expect(mocks.deleteRound).toHaveBeenCalledWith("00000000-0000-7000-0000-000000000004");
});
