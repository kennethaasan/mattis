import { test, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { FettMattisCreateSchema, ProblemDetailsSchema } from "@/lib/api/schemas";

// Set a dummy DATABASE_URL so the db client is initialized.
vi.stubEnv("DATABASE_URL", "postgresql://user:password@host:port/db");

// Now we can mock the db object.
vi.mock("@/lib/db-client", () => ({
  insertFettMattis: vi.fn(),
}));

const { insertFettMattis } = (await import("@/lib/db-client")) as any;

// Import the route under test
const { POST } = await import("@/app/api/fettmattis/route");

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
  insertFettMattis.mockClear();
});

test("T013: POST /api/fettmattis should return 400 if the request body is invalid", async () => {
  const invalidBody = { player_id: "" }; // Invalid because player_id is empty

  const req = createMockRequest(invalidBody);
  const res = await POST(req);

  expect(res.status).toBe(400);
  expect(String(res.headers.get("Content-Type") || "")).toContain("application/problem+json");

  const body = await res.json();
  expect(() => ProblemDetailsSchema.parse(body)).not.toThrow();
  expect(body.title).toBe("Bad Request");

  // Ensure the database function was NOT called
  expect(insertFettMattis).not.toHaveBeenCalled();
});

test("T013: POST /api/fettmattis should return 201 and the new fettmattis on success", async () => {
  const validBody = {
    player_id: "00000000-0000-7000-0000-000000000001",
  };
  const newFettmattis = {
    id: "00000000-0000-7000-0000-000000000005",
  };

  insertFettMattis.mockResolvedValueOnce(newFettmattis);

  const req = createMockRequest(validBody);
  const res = await POST(req);

  expect(res.status).toBe(201);
  expect(String(res.headers.get("Content-Type") || "")).toContain("application/json");

  const body = await res.json();
  expect(body).toEqual(newFettmattis);

  // Ensure the database function was called with the correct data
  expect(insertFettMattis).toHaveBeenCalled();
});