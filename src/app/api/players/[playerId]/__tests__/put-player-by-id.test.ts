import type { NextRequest } from "next/server";
import { beforeEach, expect, test, vi } from "vitest";

import { PlayerSchema, ProblemDetailsSchema } from "@/lib/api/schemas";

const mocks = vi.hoisted(() => {
  class MockNotFoundError extends Error {}
  class MockConflictError extends Error {}

  return {
    updatePlayer: vi.fn(),
    MockNotFoundError,
    MockConflictError,
  };
});

vi.mock("@/lib/db-client", () => ({
  updatePlayer: mocks.updatePlayer,
  NotFoundError: mocks.MockNotFoundError,
  ConflictError: mocks.MockConflictError,
}));

const { PUT } = await import("@/app/api/players/[playerId]/route");

const createMockRequest = (playerId: string, body: unknown) => {
  return {
    headers: new Headers(),
    nextUrl: new URL(`http://localhost/api/players/${playerId}`),
    json: () => Promise.resolve(body),
  } as unknown as NextRequest;
};

beforeEach(() => {
  mocks.updatePlayer.mockReset();
});

test("T020: PUT /api/players/{id} should return 200 and updated player", async () => {
  const playerId = "00000000-0000-7000-0000-000000000030";
  const updatedPlayer = {
    id: playerId,
    displayName: "Eva",
    active: true,
    userId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mocks.updatePlayer.mockResolvedValueOnce(updatedPlayer);

  const req = createMockRequest(playerId, { display_name: "Eva" });
  const res = await PUT(req, { params: Promise.resolve({ playerId }) });

  expect(res.status).toBe(200);
  const body = await res.json();
  expect(() => PlayerSchema.parse(body)).not.toThrow();
  expect(mocks.updatePlayer).toHaveBeenCalledWith(playerId, {
    displayName: "Eva",
    active: undefined,
  });
});

test("T020: PUT /api/players/{id} should return 404 when not found", async () => {
  const playerId = "00000000-0000-7000-0000-000000000031";
  mocks.updatePlayer.mockRejectedValueOnce(
    new mocks.MockNotFoundError("Player not found."),
  );

  const req = createMockRequest(playerId, { display_name: "Eva" });
  const res = await PUT(req, { params: Promise.resolve({ playerId }) });

  expect(res.status).toBe(404);
  const body = await res.json();
  expect(() => ProblemDetailsSchema.parse(body)).not.toThrow();
});

test("T020: PUT /api/players/{id} should return 400 on invalid body", async () => {
  const playerId = "00000000-0000-7000-0000-000000000031";

  const req = createMockRequest(playerId, { display_name: "" });
  const res = await PUT(req, { params: Promise.resolve({ playerId }) });

  expect(res.status).toBe(400);
  const contentType = res.headers.get("Content-Type") ?? "";
  expect(contentType).toContain("application/problem+json");

  const body = await res.json();
  expect(() => ProblemDetailsSchema.parse(body)).not.toThrow();
  expect(body.title).toBe("Bad Request");
  expect(body.detail).toBe("Display name cannot be empty.");
  expect(mocks.updatePlayer).not.toHaveBeenCalled();
});
