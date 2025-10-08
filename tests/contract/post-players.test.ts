import { beforeEach, expect, test, vi } from "vitest";

import { PlayerSchema, ProblemDetailsSchema } from "@/lib/api/schemas";

const mocks = vi.hoisted(() => {
  class MockConflictError extends Error {}

  return {
    createPlayer: vi.fn(),
    MockConflictError,
  };
});

vi.mock("@/lib/db-client", () => ({
  createPlayer: mocks.createPlayer,
  ConflictError: mocks.MockConflictError,
}));

const { POST } = await import("@/app/api/players/route");

beforeEach(() => {
  mocks.createPlayer.mockReset();
});

test("T008: POST /api/players returns 201 with the created player", async () => {
  const newPlayer = {
    id: "00000000-0000-7000-0000-000000000010",
    displayName: "Nova",
    active: true,
  };

  mocks.createPlayer.mockResolvedValueOnce(newPlayer);

  const request = new Request("http://localhost/api/players", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ display_name: "Nova" }),
  });

  const response = await POST(request);

  expect(response.status).toBe(201);
  const payload = await response.json();
  expect(() => PlayerSchema.parse(payload)).not.toThrow();
  expect(mocks.createPlayer).toHaveBeenCalledWith({ displayName: "Nova" });
});

test("T008: POST /api/players returns 400 when validation fails", async () => {
  const request = new Request("http://localhost/api/players", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ display_name: "" }),
  });

  const response = await POST(request);

  expect(response.status).toBe(400);
  const payload = await response.json();
  expect(Array.isArray(payload.error)).toBe(true);
  expect(mocks.createPlayer).not.toHaveBeenCalled();
});

test("T008: POST /api/players returns 409 on duplicate display name", async () => {
  mocks.createPlayer.mockRejectedValueOnce(new mocks.MockConflictError("Duplicate"));

  const request = new Request("http://localhost/api/players", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ display_name: "Nova" }),
  });

  const response = await POST(request);

  expect(response.status).toBe(409);
  const payload = await response.json();
  expect(() => ProblemDetailsSchema.parse(payload)).not.toThrow();
});
