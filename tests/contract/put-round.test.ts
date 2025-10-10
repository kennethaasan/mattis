import { test, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { ProblemDetailsSchema } from "@/lib/api/schemas";

const mocks = vi.hoisted(() => {
  class MockNotFoundError extends Error {}
  class MockConflictError extends Error {}
  class MockForbiddenError extends Error {}

  return {
    updateRound: vi.fn(),
    MockNotFoundError,
    MockConflictError,
    MockForbiddenError,
  };
});

vi.mock("@/lib/db-client", () => ({
  updateRound: mocks.updateRound,
  NotFoundError: mocks.MockNotFoundError,
  ConflictError: mocks.MockConflictError,
  ForbiddenError: mocks.MockForbiddenError,
}));

// Import the route under test
const { PUT } = await import("@/app/api/rounds/[roundId]/route");

// Mock the environment variable for the user ID
const MOCK_USER_ID = "00000000-0000-7000-0000-000000000000";
vi.stubEnv("DEV_USER_ID", MOCK_USER_ID);

// Helper function to create a mock NextRequest
const createMockRequest = (body: unknown) => {
  return {
    json: () => Promise.resolve(body),
    headers: new Headers({ "X-User-Id": MOCK_USER_ID }),
  } as unknown as NextRequest;
};

beforeEach(() => {
  mocks.updateRound.mockReset();
});

test("T011: PUT /api/rounds/{roundId} should return 400 if the request body is invalid", async () => {
  const invalidBody = { participant_ids: ["p1"] }; // Invalid because less than 2 participants

  const req = createMockRequest(invalidBody);
  const res = await PUT(req, {
    params: Promise.resolve({
      roundId: "00000000-0000-7000-0000-000000000004",
    }),
  });

  expect(res.status).toBe(400);
  const contentType = res.headers.get("Content-Type") ?? "";
  expect(contentType).toContain("application/json");

  const body = await res.json();
  expect(Array.isArray(body.error)).toBe(true);

  // Ensure the database function was NOT called
  expect(mocks.updateRound).not.toHaveBeenCalled();
});

test("T011: PUT /api/rounds/{roundId} should return 404 if the round does not exist", async () => {
  const validBody = {
    participant_ids: [
      "00000000-0000-7000-0000-000000000001",
      "00000000-0000-7000-0000-000000000002",
    ],
    loser_id: "00000000-0000-7000-0000-000000000001",
  };

  mocks.updateRound.mockRejectedValueOnce(
    new mocks.MockNotFoundError("Round not found."),
  );

  const req = createMockRequest(validBody);
  const res = await PUT(req, {
    params: Promise.resolve({
      roundId: "00000000-0000-7000-0000-000000000004",
    }),
  });

  expect(res.status).toBe(404);
  const contentType = res.headers.get("Content-Type") ?? "";
  expect(contentType).toContain("application/problem+json");

  const body = await res.json();
  expect(() => ProblemDetailsSchema.parse(body)).not.toThrow();
  expect(body.title).toBe("Not Found");
});

test("T011: PUT /api/rounds/{roundId} should return 200 and the updated round on success", async () => {
  const validBody = {
    participant_ids: [
      "00000000-0000-7000-0000-000000000001",
      "00000000-0000-7000-0000-000000000002",
    ],
    loser_id: "00000000-0000-7000-0000-000000000001",
  };
  const updatedRound = {
    id: "00000000-0000-7000-0000-000000000004",
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    createdBy: "00000000-0000-7000-0000-000000000099",
    deletedAt: null,
    participants: [
      {
        id: "00000000-0000-7000-0000-000000000001",
        displayName: "Alice",
        active: true,
      },
      {
        id: "00000000-0000-7000-0000-000000000002",
        displayName: "Bob",
        active: true,
      },
    ],
    loser: {
      id: "00000000-0000-7000-0000-000000000001",
      displayName: "Alice",
      active: true,
    },
  };

  mocks.updateRound.mockResolvedValueOnce(updatedRound);

  const req = createMockRequest(validBody);
  const res = await PUT(req, {
    params: Promise.resolve({
      roundId: "00000000-0000-7000-0000-000000000004",
    }),
  });

  expect(res.status).toBe(200);
  const contentType = res.headers.get("Content-Type") ?? "";
  expect(contentType).toContain("application/json");

  const body = await res.json();
  expect(body).toEqual({
    id: "00000000-0000-7000-0000-000000000004",
    created_at: "2025-01-01T00:00:00.000Z",
    participants: [
      {
        id: "00000000-0000-7000-0000-000000000001",
        display_name: "Alice",
        active: true,
      },
      {
        id: "00000000-0000-7000-0000-000000000002",
        display_name: "Bob",
        active: true,
      },
    ],
    loser: {
      id: "00000000-0000-7000-0000-000000000001",
      display_name: "Alice",
      active: true,
    },
  });

  // Ensure the database function was called with the correct data
  expect(mocks.updateRound).toHaveBeenCalledWith(
    "00000000-0000-7000-0000-000000000004",
    {
      participantIds: validBody.participant_ids,
      loserId: validBody.loser_id,
    },
  );
});
