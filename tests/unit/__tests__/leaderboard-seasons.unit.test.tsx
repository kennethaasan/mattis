import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getRegularLeaderboard: vi.fn(),
  getFettmattisLeaderboard: vi.fn(),
  getLeaderboardSeasons: vi.fn(),
}));

vi.mock("@/lib/leaderboard", () => ({
  getRegularLeaderboard: mocks.getRegularLeaderboard,
  getFettmattisLeaderboard: mocks.getFettmattisLeaderboard,
  getLeaderboardSeasons: mocks.getLeaderboardSeasons,
}));

const { Leaderboard } = await import("@/components/Leaderboard");

let queryClient: QueryClient;

beforeEach(() => {
  queryClient = new QueryClient();
  mocks.getRegularLeaderboard.mockResolvedValue([]);
  mocks.getFettmattisLeaderboard.mockResolvedValue([]);
  mocks.getLeaderboardSeasons.mockResolvedValue([2024, 2023, 2019]);
});

afterEach(() => {
  queryClient.clear();
  cleanup();
});

test("T192: leaderboard seasons dropdown includes the earliest year", async () => {
  render(
    <QueryClientProvider client={queryClient}>
      <Leaderboard />
    </QueryClientProvider>,
  );

  const seasonSelect = await screen.findByLabelText("Sesong");
  await within(seasonSelect).findByRole("option", { name: "2019" });

  expect(mocks.getLeaderboardSeasons).toHaveBeenCalledTimes(1);
});
