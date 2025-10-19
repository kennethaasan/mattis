import { beforeEach, expect, test, vi } from "vitest";

import { LeaderboardSeasonsResponseSchema } from "@/lib/api/schemas";

const mocks = vi.hoisted(() => ({
  getLeaderboardSeasons: vi.fn(),
}));

vi.mock("@/lib/db-client", () => ({
  getLeaderboardSeasons: mocks.getLeaderboardSeasons,
}));

const { GET } = await import("@/app/api/leaderboard/seasons/route");

beforeEach(() => {
  mocks.getLeaderboardSeasons.mockReset();
});

test("T190: GET /api/leaderboard/seasons returns all available seasons", async () => {
  mocks.getLeaderboardSeasons.mockResolvedValueOnce([2024, 2023, 2020]);

  const response = await GET(
    new Request("http://localhost/api/leaderboard/seasons"),
  );

  expect(response.status).toBe(200);
  const payload = await response.json();
  expect(() => LeaderboardSeasonsResponseSchema.parse(payload)).not.toThrow();
  expect(payload).toMatchObject({ seasons: [2024, 2023, 2020] });
});

test("T191: GET /api/leaderboard/seasons returns 500 on failure", async () => {
  mocks.getLeaderboardSeasons.mockRejectedValueOnce(new Error("DB down"));

  const response = await GET(
    new Request("http://localhost/api/leaderboard/seasons"),
  );

  expect(response.status).toBe(500);
  const payload = await response.json();
  expect(payload.title).toBe("Internal Server Error");
});
