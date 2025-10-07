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

const { PUT } = await import("@/app/api/players/[playerId]/route");

const MOCK_USER_ID = "00000000-0000-7000-0000-000000000000";
vi.stubEnv("DEV_USER_ID", MOCK_USER_ID);

const createMockRequest = (playerId: string, body: any) => {
  return {
    headers: new Headers({ "X-User-Id": MOCK_USER_ID }),
    nextUrl: new URL(`http://localhost/api/players/${playerId}`),
    json: async () => body,
  } as unknown as NextRequest;
};

beforeEach(() => {
  updatePlayer.mockClear();
});

test("T020: PUT /api/players/{id} should return 200 and updated player", async () => {
  const playerId = "00000000-0000-7000-0000-000000000030";
  const player = { id: playerId, displayName: "Eve", active: true };
  const updatedPlayer = { ...player, displayName: "Eva" };

  updatePlayer.mockResolvedValueOnce(updatedPlayer);

  const req = createMockRequest(playerId, { display_name: "Eva" });
  const res = await PUT(req, { params: { playerId } } as any);

  expect(res.status).toBe(200);
  const body = await res.json();
  expect(() => PlayerSchema.parse(body)).not.toThrow();
  expect(updatePlayer).toHaveBeenCalledWith(playerId, { displayName: "Eva", active: undefined });
});

test("T020: PUT /api/players/{id} should return 404 when not found", async () => {
  const playerId = "00000000-0000-7000-0000-000000000031";
  updatePlayer.mockResolvedValueOnce(null);

  const req = createMockRequest(playerId, { display_name: "Eva" });
  const res = await PUT(req, { params: { playerId } } as any);

  expect(res.status).toBe(404);
  const body = await res.json();
  expect(() => ProblemDetailsSchema.parse(body)).not.toThrow();
});

test("T020: PUT /api/players/{id} should return 400 on invalid body", async () => {
    const playerId = "00000000-0000-7000-0000-000000000031";
    updatePlayer.mockResolvedValueOnce(null);
  
    const req = createMockRequest(playerId, { display_name: "" });
    const res = await PUT(req, { params: { playerId } } as any);
  
    expect(res.status).toBe(400);
    const body = await res.json();
  });
