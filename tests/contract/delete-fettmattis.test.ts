import { test, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { ProblemDetailsSchema } from "@/lib/api/schemas";

// Set a dummy DATABASE_URL so the db client is initialized.
vi.stubEnv("DATABASE_URL", "postgresql://user:password@host:port/db");

// Now we can mock the db object.
vi.mock("@/lib/db", () => ({
  db: {
    delete: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  },
}));

// Import the mocked module
const db = (await import("@/lib/db")) as any;

// Import the route under test
const { DELETE } = await import("@/app/api/fettmattis/[fettmattisId]/route");

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
  // Reset mocks before each test
  db.db.delete.mockClear();
  db.db.where.mockClear();
  db.db.returning.mockClear();
});

test("T014: DELETE /api/fettmattis/{fettmattisId} should return 404 if the fettmattis does not exist", async () => {
  db.db.returning.mockResolvedValueOnce([]);

  const req = createMockRequest();
  const res = await DELETE(req, { params: { fettmattisId: "00000000-0000-7000-0000-000000000005" } });

  expect(res.status).toBe(404);
  expect(String(res.headers.get("Content-Type") || "")).toContain("application/problem+json");

  const body = await res.json();
  expect(() => ProblemDetailsSchema.parse(body)).not.toThrow();
  expect(body.title).toBe("Not Found");
});

test("T014: DELETE /api/fettmattis/{fettmattisId} should return 204 on success", async () => {
  const deletedFettmattis = {
    id: "00000000-0000-7000-0000-000000000005",
  };

  db.db.returning.mockResolvedValueOnce([deletedFettmattis]);

  const req = createMockRequest();
  const res = await DELETE(req, { params: { fettmattisId: "00000000-0000-7000-0000-000000000005" } });

  expect(res.status).toBe(204);

  // Ensure the database function was called with the correct data
  expect(db.db.delete).toHaveBeenCalled();
});