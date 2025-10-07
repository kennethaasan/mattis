import { beforeEach, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";

import { PlayerSchema, ProblemDetailsSchema } from "@/lib/api/schemas";

const mocks = vi.hoisted(() => {
  class MockNotFoundError extends Error {}

  return {
    getPlayerById: vi.fn(),
    updatePlayer: vi.fn(),
    MockNotFoundError,
  };
});

vi.mock("@/lib/db-client", () => ({
  getPlayerById: mocks.getPlayerById,
  updatePlayer: mocks.updatePlayer,
  NotFoundError: mocks.MockNotFoundError,
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
  mocks.getPlayerById.mockReset();
});

test("T011: GET /api/players/{id} should return 200 and player", async () => {
  const playerId = "00000000-0000-7000-0000-000000000030";
  const player = {
    id: playerId,
    displayName: "Eve",
    active: true,
    userId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mocks.getPlayerById.mockResolvedValueOnce(player);

  const req = createMockRequest(playerId);
  const res = await GET(req, { params: Promise.resolve({ playerId }) });

  expect(res.status).toBe(200);
  const body = await res.json();
  expect(() => PlayerSchema.parse(body)).not.toThrow();
  expect(mocks.getPlayerById).toHaveBeenCalledWith(playerId);
});

test("T011: GET /api/players/{id} should return 404 when not found", async () => {
  const playerId = "00000000-0000-7000-0000-000000000031";
  mocks.getPlayerById.mockRejectedValueOnce(new mocks.MockNotFoundError("Player not found."));

  const req = createMockRequest(playerId);
  const res = await GET(req, { params: Promise.resolve({ playerId }) });

  expect(res.status).toBe(404);
  const body = await res.json();
  expect(() => ProblemDetailsSchema.parse(body)).not.toThrow();
});

test("T011: GET /api/players/{id} should return 500 on DB error", async () => {
  const playerId = "00000000-0000-7000-0000-000000000032";
  const dbError = new Error("DB down");
  mocks.getPlayerById.mockRejectedValueOnce(dbError);

  const req = createMockRequest(playerId);
  const res = await GET(req, { params: Promise.resolve({ playerId }) });

  expect(res.status).toBe(500);
  const body = await res.json();
  expect(() => ProblemDetailsSchema.parse(body)).not.toThrow();
});
