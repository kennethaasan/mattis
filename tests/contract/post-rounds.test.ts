import { test, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { RoundCreateSchema, ProblemDetailsSchema } from "@/lib/api/schemas";

// Set a dummy DATABASE_URL so the db client is initialized.
vi.stubEnv("DATABASE_URL", "postgresql://user:password@host:port/db");

// Now we can mock the db object.
vi.mock("@/lib/db", () => ({
  db: {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  },
}));

// Import the mocked module
const db = (await import("@/lib/db")) as any;

// Import the route under test
const { POST } = await import("@/app/api/rounds/route");

// Mock the environment variable for the user ID
const MOCK_USER_ID = "00000000-0000-7000-0000-000000000000";
vi.stubEnv("DEV_USER_ID", MOCK_USER_ID);

// Helper function to create a mock NextRequest
const createMockRequest = (body: any) => {
  return {
    json: async () => body,
    headers: new Headers({ "X-User-Id": MOCK_USER_ID }),
  } as unknown as NextRequest;
};

beforeEach(() => {
  // Reset mocks before each test
  db.db.insert.mockClear();
  db.db.values.mockClear();
  db.db.returning.mockClear();
});

test("T010: POST /api/rounds should return 400 if the request body is invalid", async () => {
  const invalidBody = { participant_ids: ["p1"], loser_id: "p1" }; // Invalid because less than 2 participants

  const req = createMockRequest(invalidBody);
  const res = await POST(req);

  expect(res.status).toBe(400);
  expect(String(res.headers.get("Content-Type") || "")).toContain("application/problem+json");

  const body = await res.json();
  expect(() => ProblemDetailsSchema.parse(body)).not.toThrow();
  expect(body.title).toBe("Bad Request");

  // Ensure the database function was NOT called
  expect(db.db.insert).not.toHaveBeenCalled();
});

test("T010: POST /api/rounds should return 201 and the new round on success", async () => {
  const validBody = {
    participant_ids: ["00000000-0000-7000-0000-000000000001", "00000000-0000-7000-0000-000000000002"],
    loser_id: "00000000-0000-7000-0000-000000000001",
  };
  const newRound = {
    id: "00000000-0000-7000-0000-000000000004",
  };

  db.db.returning.mockResolvedValueOnce([newRound]);

  const req = createMockRequest(validBody);
  const res = await POST(req);

  expect(res.status).toBe(201);
  expect(String(res.headers.get("Content-Type") || "")).toContain("application/json");

  const body = await res.json();
  expect(body).toEqual(newRound);

  // Ensure the database function was called with the correct data
  expect(db.db.insert).toHaveBeenCalled();
});