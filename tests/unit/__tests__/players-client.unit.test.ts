import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/lib/api/client", () => ({
  apiClient: {
    GET: vi.fn(),
    POST: vi.fn(),
    PUT: vi.fn(),
  },
  problemToError: vi.fn((_problem, fallback) => new Error(fallback)),
}));

import { apiClient, problemToError } from "@/lib/api/client";
import {
  createPlayer,
  fetchPlayers,
  PLAYERS_QUERY_KEY,
  updatePlayer,
} from "@/lib/api/players-client";
import type { Player } from "@/lib/api/schemas";

const mockApiClient = vi.mocked(apiClient);
const mockProblemToError = vi.mocked(problemToError);

const PLAYER_ID = "00000000-0000-4000-8000-000000000001";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("players-client", () => {
  test("exposes a stable players query key", () => {
    expect(PLAYERS_QUERY_KEY).toEqual(["players"]);
  });

  test("fetchPlayers returns data", async () => {
    const players: Player[] = [
      { id: PLAYER_ID, display_name: "Ada", active: true },
      {
        id: "00000000-0000-4000-8000-000000000002",
        display_name: "Nils",
        active: false,
      },
    ];

    mockApiClient.GET.mockResolvedValueOnce({
      data: players,
      response: new Response(),
      error: undefined,
    });

    const result = await fetchPlayers();

    expect(mockApiClient.GET).toHaveBeenCalledWith("/players");
    expect(result).toEqual(players);
  });

  test("fetchPlayers throws when data is missing", async () => {
    mockApiClient.GET.mockResolvedValueOnce({
      data: undefined,
      response: new Response(),
      error: { detail: "Missing" },
    });

    await expect(fetchPlayers()).rejects.toThrow(
      "Received an invalid response when loading players.",
    );
  });

  test("createPlayer posts a validated payload", async () => {
    const payload = { display_name: "Nova" };
    const created: Player = {
      id: PLAYER_ID,
      display_name: "Nova",
      active: true,
    };

    mockApiClient.POST.mockResolvedValueOnce({
      data: created,
      response: new Response(),
      error: undefined,
    });

    const result = await createPlayer(payload);

    expect(mockApiClient.POST).toHaveBeenCalledWith("/players", {
      body: payload,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    expect(result).toEqual(created);
  });

  test("createPlayer surfaces API errors", async () => {
    const payload = { display_name: "Nova" };
    const apiError = {
      type: "about:blank",
      title: "Conflict",
      status: 409,
      detail: "Duplicate",
    };

    mockApiClient.POST.mockResolvedValueOnce({
      data: undefined,
      response: new Response(),
      error: apiError,
    });

    await expect(createPlayer(payload)).rejects.toThrow(
      "Kunne ikke opprette spiller",
    );
    expect(mockProblemToError).toHaveBeenCalledWith(
      apiError,
      "Kunne ikke opprette spiller",
    );
  });

  test("updatePlayer sends path params and payload", async () => {
    const update = { display_name: "Updated", active: false };
    const updated: Player = {
      id: PLAYER_ID,
      display_name: "Updated",
      active: false,
    };

    mockApiClient.PUT.mockResolvedValueOnce({
      data: updated,
      response: new Response(),
      error: undefined,
    });

    const result = await updatePlayer(PLAYER_ID, update);

    expect(mockApiClient.PUT).toHaveBeenCalledWith("/players/{playerId}", {
      params: {
        path: {
          playerId: PLAYER_ID,
        },
      },
      body: update,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    expect(result).toEqual(updated);
  });

  test("updatePlayer surfaces API errors", async () => {
    const apiError = {
      type: "about:blank",
      title: "Forbidden",
      status: 403,
      detail: "Not allowed",
    };

    mockApiClient.PUT.mockResolvedValueOnce({
      data: undefined,
      response: new Response(),
      error: apiError,
    });

    await expect(updatePlayer(PLAYER_ID, { active: true })).rejects.toThrow(
      "We couldn't update the player right now.",
    );
    expect(mockProblemToError).toHaveBeenCalledWith(
      apiError,
      "We couldn't update the player right now.",
    );
  });
});
