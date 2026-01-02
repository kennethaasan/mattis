import { beforeEach, expect, test, vi } from "vitest";

import { PlayerSchema } from "@/lib/api/schemas";

const mocks = vi.hoisted(() => ({
  listPlayers: vi.fn(),
}));

vi.mock("@/lib/db-client", () => ({
  listPlayers: mocks.listPlayers,
}));

const { GET } = await import("@/app/api/players/route");

beforeEach(() => {
  mocks.listPlayers.mockReset();
});

test("T009: GET /api/players returns 200 with all players", async () => {
  mocks.listPlayers.mockResolvedValueOnce([
    {
      id: "00000000-0000-7000-0000-000000000020",
      displayName: "Aria",
      active: true,
    },
    {
      id: "00000000-0000-7000-0000-000000000021",
      displayName: "Bryn",
      active: false,
    },
  ]);

  const response = await GET(new Request("http://localhost/api/players"));

  expect(response.status).toBe(200);
  const payload = await response.json();
  expect(() => PlayerSchema.array().parse(payload)).not.toThrow();
});

test("T009: GET /api/players returns 500 when the database call fails", async () => {
  mocks.listPlayers.mockRejectedValueOnce(new Error("DB down"));

  const response = await GET(new Request("http://localhost/api/players"));

  expect(response.status).toBe(500);
  const payload = await response.json();
  expect(payload.title).toBe("Internal Server Error");
});
