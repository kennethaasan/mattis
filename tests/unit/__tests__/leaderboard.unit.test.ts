import { beforeEach, describe, expect, test, vi } from "vitest";

// Mock the apiClient before importing the module under test
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    GET: vi.fn(),
  },
}));

import { apiClient } from "@/lib/api/client";
import {
  getFettmattisLeaderboard,
  getLeaderboardSeasons,
  getRegularLeaderboard,
} from "@/lib/leaderboard";

const mockApiClient = vi.mocked(apiClient);

describe("leaderboard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getRegularLeaderboard", () => {
    test("fetches regular leaderboard with 'all' scope", async () => {
      mockApiClient.GET.mockResolvedValueOnce({
        data: [
          {
            player: { id: "player-1", display_name: "Alice" },
            participation_count: 10,
            loss_count: 3,
            loss_percentage: 30,
            rank: 1,
          },
          {
            player: { id: "player-2", display_name: "Bob" },
            participation_count: 8,
            loss_count: 5,
            loss_percentage: 62.5,
            rank: 2,
          },
        ],
        response: new Response(),
        error: undefined,
      });

      const result = await getRegularLeaderboard("all");

      expect(mockApiClient.GET).toHaveBeenCalledWith("/leaderboard/regular", {
        params: { query: { year: "all" } },
        credentials: "include",
      });

      expect(result).toEqual([
        {
          playerId: "player-1",
          playerName: "Alice",
          roundsPlayed: 10,
          totalLosses: 3,
          lossPercentage: 30,
          rank: 1,
        },
        {
          playerId: "player-2",
          playerName: "Bob",
          roundsPlayed: 8,
          totalLosses: 5,
          lossPercentage: 62.5,
          rank: 2,
        },
      ]);
    });

    test("fetches regular leaderboard with year scope", async () => {
      mockApiClient.GET.mockResolvedValueOnce({
        data: [
          {
            player: { id: "player-1", display_name: "Charlie" },
            participation_count: 5,
            loss_count: 2,
            loss_percentage: 40,
            rank: 1,
          },
        ],
        response: new Response(),
        error: undefined,
      });

      await getRegularLeaderboard(2024);

      expect(mockApiClient.GET).toHaveBeenCalledWith("/leaderboard/regular", {
        params: { query: { year: 2024 } },
        credentials: "include",
      });
    });

    test("uses index+1 when rank is null", async () => {
      mockApiClient.GET.mockResolvedValueOnce({
        data: [
          {
            player: { id: "player-1", display_name: "Alice" },
            participation_count: 10,
            loss_count: 3,
            loss_percentage: 30,
            rank: null,
          },
          {
            player: { id: "player-2", display_name: "Bob" },
            participation_count: 8,
            loss_count: 5,
            loss_percentage: 62.5,
            rank: null,
          },
        ],
        response: new Response(),
        error: undefined,
      });

      const result = await getRegularLeaderboard("all");

      expect(result[0]?.rank).toBe(1);
      expect(result[1]?.rank).toBe(2);
    });

    test("throws error when data is undefined", async () => {
      mockApiClient.GET.mockResolvedValueOnce({
        data: undefined,
        response: new Response(),
        error: { message: "Not found" },
      });

      await expect(getRegularLeaderboard("all")).rejects.toThrow(
        "Received an invalid response when loading the leaderboard.",
      );
    });
  });

  describe("getFettmattisLeaderboard", () => {
    test("fetches fettmattis leaderboard with 'all' scope", async () => {
      mockApiClient.GET.mockResolvedValueOnce({
        data: [
          {
            player: { id: "player-1", display_name: "Alice" },
            fettmattis_count: 5,
            rank: 1,
          },
          {
            player: { id: "player-2", display_name: "Bob" },
            fettmattis_count: 3,
            rank: 2,
          },
        ],
        response: new Response(),
        error: undefined,
      });

      const result = await getFettmattisLeaderboard("all");

      expect(mockApiClient.GET).toHaveBeenCalledWith(
        "/leaderboard/fettmattis",
        {
          params: { query: { year: "all" } },
          credentials: "include",
        },
      );

      expect(result).toEqual([
        {
          playerId: "player-1",
          playerName: "Alice",
          fettmattisCount: 5,
          rank: 1,
        },
        {
          playerId: "player-2",
          playerName: "Bob",
          fettmattisCount: 3,
          rank: 2,
        },
      ]);
    });

    test("fetches fettmattis leaderboard with year scope", async () => {
      mockApiClient.GET.mockResolvedValueOnce({
        data: [
          {
            player: { id: "player-1", display_name: "Charlie" },
            fettmattis_count: 2,
            rank: 1,
          },
        ],
        response: new Response(),
        error: undefined,
      });

      await getFettmattisLeaderboard(2023);

      expect(mockApiClient.GET).toHaveBeenCalledWith(
        "/leaderboard/fettmattis",
        {
          params: { query: { year: 2023 } },
          credentials: "include",
        },
      );
    });

    test("uses index+1 when rank is null", async () => {
      mockApiClient.GET.mockResolvedValueOnce({
        data: [
          {
            player: { id: "player-1", display_name: "Alice" },
            fettmattis_count: 5,
            rank: null,
          },
          {
            player: { id: "player-2", display_name: "Bob" },
            fettmattis_count: 3,
            rank: null,
          },
        ],
        response: new Response(),
        error: undefined,
      });

      const result = await getFettmattisLeaderboard("all");

      expect(result[0]?.rank).toBe(1);
      expect(result[1]?.rank).toBe(2);
    });

    test("throws error when data is undefined", async () => {
      mockApiClient.GET.mockResolvedValueOnce({
        data: undefined,
        response: new Response(),
        error: { message: "Not found" },
      });

      await expect(getFettmattisLeaderboard("all")).rejects.toThrow(
        "Received an invalid response when loading the leaderboard.",
      );
    });
  });

  describe("getLeaderboardSeasons", () => {
    test("fetches available seasons", async () => {
      mockApiClient.GET.mockResolvedValueOnce({
        data: { seasons: [2024, 2023, 2022] },
        response: new Response(),
        error: undefined,
      });

      const result = await getLeaderboardSeasons();

      expect(mockApiClient.GET).toHaveBeenCalledWith("/leaderboard/seasons", {
        credentials: "include",
      });

      expect(result).toEqual([2024, 2023, 2022]);
    });

    test("throws error when data is undefined", async () => {
      mockApiClient.GET.mockResolvedValueOnce({
        data: undefined,
        response: new Response(),
        error: { message: "Not found" },
      });

      await expect(getLeaderboardSeasons()).rejects.toThrow(
        "Received an invalid response when loading leaderboard seasons.",
      );
    });
  });
});
