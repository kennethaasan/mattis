import type { NextRequest } from "next/server";
import { beforeEach, expect, test, vi } from "vitest";
import { ProblemDetailsSchema } from "@/lib/api/schemas";

const mocks = vi.hoisted(() => {
  class MockNotFoundError extends Error {}
  class MockConflictError extends Error {}

  return {
    createFettMattis: vi.fn(),
    MockNotFoundError,
    MockConflictError,
  };
});

vi.mock("@/lib/db-client", () => ({
  createFettMattis: mocks.createFettMattis,
  NotFoundError: mocks.MockNotFoundError,
  ConflictError: mocks.MockConflictError,
}));

const { POST } = await import("@/app/api/fettmattis/route");

const createRequest = (body: unknown) => {
  return {
    headers: new Headers(),
    json: () => Promise.resolve(body),
  } as unknown as NextRequest;
};

beforeEach(() => {
  mocks.createFettMattis.mockReset();
});

test("T013: POST /api/fettmattis returns 201 with the created record", async () => {
  const record = {
    id: "00000000-0000-7000-0000-000000000080",
    player: {
      id: "00000000-0000-7000-0000-000000000081",
      displayName: "Zia",
      active: true,
    },
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
  };

  mocks.createFettMattis.mockResolvedValueOnce(record);

  const request = createRequest({
    player_id: record.player.id,
  });

  const response = await POST(request);

  expect(response.status).toBe(201);
  const payload = await response.json();
  expect(payload).toMatchObject({
    id: record.id,
    player: {
      id: record.player.id,
      display_name: record.player.displayName,
      active: true,
    },
    created_at: record.createdAt.toISOString(),
  });
  expect(mocks.createFettMattis).toHaveBeenCalledWith({
    playerId: record.player.id,
    createdBy: process.env.BASIC_AUTH_USER_ID,
  });
});

test("T013: POST /api/fettmattis returns 400 when validation fails", async () => {
  const request = createRequest({
    player_id: "",
  });

  const response = await POST(request);

  expect(response.status).toBe(400);
  const contentType = response.headers.get("Content-Type") ?? "";
  expect(contentType).toContain("application/problem+json");

  const payload = await response.json();
  expect(() => ProblemDetailsSchema.parse(payload)).not.toThrow();
  expect(payload.title).toBe("Bad Request");
  expect(payload.detail).toBe("Must be a valid UUID.");
  expect(mocks.createFettMattis).not.toHaveBeenCalled();
});

test("T013: POST /api/fettmattis returns 404 when the player or round is missing", async () => {
  mocks.createFettMattis.mockRejectedValueOnce(
    new mocks.MockNotFoundError("Missing player"),
  );

  const request = createRequest({
    player_id: "00000000-0000-7000-0000-000000000081",
  });

  const response = await POST(request);

  expect(response.status).toBe(404);
  const payload = await response.json();
  expect(() => ProblemDetailsSchema.parse(payload)).not.toThrow();
});

test("T013: POST /api/fettmattis returns 409 when a duplicate is detected", async () => {
  mocks.createFettMattis.mockRejectedValueOnce(
    new mocks.MockConflictError("Duplicate"),
  );

  const request = createRequest({
    player_id: "00000000-0000-7000-0000-000000000081",
  });

  const response = await POST(request);

  expect(response.status).toBe(409);
  const payload = await response.json();
  expect(() => ProblemDetailsSchema.parse(payload)).not.toThrow();
});
