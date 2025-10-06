import { test, expect, vi, beforeEach } from "vitest";
import { PlayerSchema } from "@/lib/api/schemas";
import { NextRequest } from "next/server";

// Hoist a mock for the db-client module. The factory must not reference
// variables that are initialized later because vi.mock factories are hoisted.
vi.mock("@/lib/db-client", () => ({
  listPlayers: vi.fn(),
}));

// Import the mocked module so we can access the mock function instance.
const dbClient = (await import("@/lib/db-client")) as any;
const listPlayers = dbClient.listPlayers as any;

// Now import the route under test so it receives the mocked db-client.
const { GET } = await import("@/app/api/players/route");

// Mock the environment variable for the user ID
const MOCK_USER_ID = "00000000-0000-7000-0000-000000000000";
vi.stubEnv("DEV_USER_ID", MOCK_USER_ID);

// Helper function to create a mock NextRequest
const createMockRequest = () => {
  return {
    json: async () => undefined,
    headers: new Headers({ "X-User-Id": MOCK_USER_ID }),
  } as unknown as NextRequest;
};

beforeEach(() => {
  // Reset mocks before each test
  listPlayers.mockClear();
});

test("T019: GET /api/players should return a list of players", async () => {
  const mockPlayers = [
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
  ];

  listPlayers.mockResolvedValueOnce(mockPlayers);

  const req = createMockRequest();
  const res = await GET(req);

  expect(res.status).toBe(200);
  expect(String(res.headers.get("Content-Type") || "")).toContain("application/json");

  const body = await res.json();
  expect(Array.isArray(body)).toBe(true);
  for (const item of body) {
    expect(() => PlayerSchema.parse(item)).not.toThrow();
  }

  expect(listPlayers).toHaveBeenCalled();
});
