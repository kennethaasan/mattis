import { beforeEach, expect, test, vi } from "vitest";
import { z } from "zod";

import { PlayerSchema } from "@/lib/api/schemas";

const mocks = vi.hoisted(() => ({
  getMostRecentRound: vi.fn(),
}));

vi.mock("@/lib/db-client", () => ({
  getMostRecentRound: mocks.getMostRecentRound,
}));

const LatestRoundResponseSchema = z
  .object({
    id: z.string(),
    created_at: z.string(),
    participants: PlayerSchema.pick({
      id: true,
      display_name: true,
      active: true,
    }).array(),
    loser: PlayerSchema.pick({
      id: true,
      display_name: true,
      active: true,
    }),
  })
  .nullable();

const { GET } = await import("@/app/api/rounds/latest/route");

beforeEach(() => {
  mocks.getMostRecentRound.mockReset();
});

test("T025: GET /api/rounds/latest returns the most recent round", async () => {
  mocks.getMostRecentRound.mockResolvedValueOnce({
    id: "00000000-0000-7000-0000-000000000555",
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    createdBy: "00000000-0000-7000-0000-000000000123",
    deletedAt: null,
    participants: [
      {
        id: "00000000-0000-7000-0000-000000000100",
        displayName: "Ari",
        active: true,
      },
      {
        id: "00000000-0000-7000-0000-000000000101",
        displayName: "Bryn",
        active: true,
      },
    ],
    loser: {
      id: "00000000-0000-7000-0000-000000000101",
      displayName: "Bryn",
      active: true,
    },
  });

  const response = await GET();

  expect(response.status).toBe(200);
  const payload = await response.json();
  expect(() => LatestRoundResponseSchema.parse(payload)).not.toThrow();
});

test("T025: GET /api/rounds/latest returns null when there are no rounds", async () => {
  mocks.getMostRecentRound.mockResolvedValueOnce(null);

  const response = await GET();

  expect(response.status).toBe(200);
  const payload = await response.json();
  expect(payload).toBeNull();
});

test("T025: GET /api/rounds/latest returns 500 on database errors", async () => {
  mocks.getMostRecentRound.mockRejectedValueOnce(new Error("db offline"));

  const response = await GET();

  expect(response.status).toBe(500);
  const payload = await response.json();
  expect(payload.title).toBe("Internal Server Error");
});
