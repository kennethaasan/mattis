import { test, expect, vi, beforeEach } from "vitest";
import { PlayerSchema, ProblemDetailsSchema } from "@/lib/api/schemas";
import { NextRequest } from "next/server";

const { getPlayerById, updatePlayer } = vi.hoisted(() => {
  return {
    getPlayerById: vi.fn(),
    updatePlayer: vi.fn(),
  };
});

vi.mock("@/lib/db/db-client", () => ({
  getPlayerById,
  updatePlayer,
}));

const { GET } = await import("@/app/api/players/[playerId]/route");

const MOCK_USER_ID = "00000000-0000-7000-0000-000000000000";
vi.stubEnv("DEV_USER_ID", MOCK_USER_ID);

const createMockRequest = (playerId: string) => {
  return {
    headers: new Headers({ "X-User-Id": MOCK_USER_ID }),
    nextUrl: new URL(`http://localhost/api/players/${playerId}`),
  } as unknown as NextRequest;
};

beforeEach(() => {
  getPlayerById.mockClear();
});

test("T011: GET /api/players/{id} should return 200 and player", async () => {
  const playerId = "00000000-0000-7000-0000-000000000030";
  const player = { id: playerId, displayName: "Eve", active: true };

  getPlayerById.mockResolvedValueOnce(player);

  const req = createMockRequest(playerId);
  const res = await GET(req, { params: { playerId } } as any);

  expect(res.status).toBe(200);
  const body = await res.json();
  expect(() => PlayerSchema.parse(body)).not.toThrow();
  expect(getPlayerById).toHaveBeenCalledWith(playerId);
});

test("T011: GET /api/players/{id} should return 404 when not found", async () => {
  const playerId = "00000000-0000-7000-0000-000000000031";
  getPlayerById.mockResolvedValueOnce(null);

  const req = createMockRequest(playerId);
  const res = await GET(req, { params: { playerId } } as any);

  expect(res.status).toBe(404);
  const body = await res.json();
  expect(() => ProblemDetailsSchema.parse(body)).not.toThrow();
});

test("T011: GET /api/players/{id} should return 500 on DB error", async () => {
  const playerId = "00000000-0000-7000-0000-000000000032";
  const dbError = new Error("DB down");
  getPlayerById.mockRejectedValueOnce(dbError);

  const req = createMockRequest(playerId);
  const res = await GET(req, { params: { playerId } } as any);

  expect(res.status).toBe(500);
  const body = await res.json();
  expect(() => ProblemDetailsSchema.parse(body)).not.toThrow();
});
