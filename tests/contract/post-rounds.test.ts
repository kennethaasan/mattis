import { beforeEach, expect, test, vi } from "vitest";
import type { NextRequest } from "next/server";

import { ProblemDetailsSchema } from "@/lib/api/schemas";

const mocks = vi.hoisted(() => {
  class MockNotFoundError extends Error {}
  class MockConflictError extends Error {}

  return {
    createRound: vi.fn(),
    MockNotFoundError,
    MockConflictError,
  };
});

vi.mock("@/lib/db-client", () => ({
  createRound: mocks.createRound,
  NotFoundError: mocks.MockNotFoundError,
  ConflictError: mocks.MockConflictError,
}));

const { POST } = await import("@/app/api/rounds/route");

const MOCK_USER_ID = "00000000-0000-7000-0000-000000000050";
vi.stubEnv("DEV_USER_ID", MOCK_USER_ID);

const createRequest = (body: unknown, headers?: HeadersInit) =>
  ({
    headers: new Headers({ "X-User-Id": MOCK_USER_ID, ...headers }),
    json: async () => body,
  }) as unknown as NextRequest;

beforeEach(() => {
  mocks.createRound.mockReset();
});

test("T010: POST /api/rounds returns 201 with the created round", async () => {
  const roundRecord = {
    id: "00000000-0000-7000-0000-000000000060",
    createdAt: new Date("2025-01-01T12:00:00.000Z"),
    participants: [
      { id: "00000000-0000-7000-0000-000000000061", displayName: "Kai", active: true },
      { id: "00000000-0000-7000-0000-000000000062", displayName: "Mina", active: true },
    ],
    loser: { id: "00000000-0000-7000-0000-000000000062", displayName: "Mina", active: true },
  };

  mocks.createRound.mockResolvedValueOnce(roundRecord);

  const request = createRequest({
    participant_ids: [
      "00000000-0000-7000-0000-000000000061",
      "00000000-0000-7000-0000-000000000062",
    ],
    loser_id: "00000000-0000-7000-0000-000000000062",
  });

  const response = await POST(request);

  expect(response.status).toBe(201);
  const payload = await response.json();
  expect(payload).toMatchObject({
    id: roundRecord.id,
    created_at: roundRecord.createdAt.toISOString(),
    participants: [
      { id: "00000000-0000-7000-0000-000000000061", display_name: "Kai", active: true },
      { id: "00000000-0000-7000-0000-000000000062", display_name: "Mina", active: true },
    ],
    loser: {
      id: "00000000-0000-7000-0000-000000000062",
      display_name: "Mina",
      active: true,
    },
  });
  expect(mocks.createRound).toHaveBeenCalledWith({
    participantIds: [
      "00000000-0000-7000-0000-000000000061",
      "00000000-0000-7000-0000-000000000062",
    ],
    loserId: "00000000-0000-7000-0000-000000000062",
    createdBy: MOCK_USER_ID,
  });
});

test("T010: POST /api/rounds returns 400 when validation fails", async () => {
  const request = createRequest({
    participant_ids: ["00000000-0000-7000-0000-000000000061"],
    loser_id: "00000000-0000-7000-0000-000000000061",
  });

  const response = await POST(request);

  expect(response.status).toBe(400);
  const payload = await response.json();
  expect(Array.isArray(payload.error)).toBe(true);
});

test("T010: POST /api/rounds returns 404 when a participant is missing", async () => {
  mocks.createRound.mockRejectedValueOnce(new mocks.MockNotFoundError("Missing participant"));

  const request = createRequest({
    participant_ids: [
      "00000000-0000-7000-0000-000000000061",
      "00000000-0000-7000-0000-000000000062",
    ],
    loser_id: "00000000-0000-7000-0000-000000000062",
  });

  const response = await POST(request);

  expect(response.status).toBe(404);
  const payload = await response.json();
  expect(() => ProblemDetailsSchema.parse(payload)).not.toThrow();
});

test("T010: POST /api/rounds returns 409 when there is a conflict", async () => {
  mocks.createRound.mockRejectedValueOnce(new mocks.MockConflictError("Conflict"));

  const request = createRequest({
    participant_ids: [
      "00000000-0000-7000-0000-000000000061",
      "00000000-0000-7000-0000-000000000062",
    ],
    loser_id: "00000000-0000-7000-0000-000000000062",
  });

  const response = await POST(request);

  expect(response.status).toBe(409);
  const payload = await response.json();
  expect(() => ProblemDetailsSchema.parse(payload)).not.toThrow();
});
