import { test, expect, vi, beforeEach } from "vitest";
import { PlayerSchema, ProblemDetailsSchema } from "@/lib/api/schemas";
import { NextRequest } from "next/server";

vi.mock("@/lib/db-client", () => ({
  listPlayers: vi.fn(),
}));

const dbClient = (await import("@/lib/db-client")) as any;
const listPlayers = dbClient.listPlayers as any;

const { GET } = await import("@/app/api/players/route");

const MOCK_USER_ID = "00000000-0000-7000-0000-000000000000";
vi.stubEnv("DEV_USER_ID", MOCK_USER_ID);

const createMockRequest = () => {
  return {
    headers: new Headers({ "X-User-Id": MOCK_USER_ID }),
  } as unknown as NextRequest;
};

beforeEach(() => {
  listPlayers.mockClear();
});

test("T009: GET /api/players should return list of players with 200", async () => {
  const mockPlayers = [
    {
      id: "00000000-0000-7000-0000-000000000010",
      display_name: "Alice",
      active: true,
    },
    {
      id: "00000000-0000-7000-0000-000000000011",
      display_name: "Bob",
      active: true,
    },
  ];

  listPlayers.mockResolvedValueOnce(mockPlayers);

  const req = createMockRequest();
  const res = await GET(req);

  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Type")).toContain("application/json");

  const body = await res.json();
  expect(Array.isArray(body)).toBe(true);
  body.forEach((item: unknown) => expect(() => PlayerSchema.parse(item)).not.toThrow());
  expect(listPlayers).toHaveBeenCalled();
});

test("T009: GET /api/players should return 500 on DB error", async () => {
  const dbError = new Error("DB down");
  listPlayers.mockRejectedValueOnce(dbError);

  const req = createMockRequest();
  const res = await GET(req);

  expect(res.status).toBe(500);
  expect(String(res.headers.get("Content-Type") || "")).toContain("application/problem+json");

  const body = await res.json();
  expect(() => ProblemDetailsSchema.parse(body)).not.toThrow();
});
