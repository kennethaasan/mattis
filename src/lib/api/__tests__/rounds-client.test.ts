import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/lib/api/client", () => ({
  apiClient: {
    GET: vi.fn(),
    POST: vi.fn(),
    DELETE: vi.fn(),
  },
  problemToError: vi.fn((_problem, fallback) => new Error(fallback)),
}));

import { apiClient, problemToError } from "@/lib/api/client";
import {
  createRound,
  createRoundsListQueryKey,
  deleteRound,
  fetchLatestRound,
  fetchRounds,
  LATEST_ROUND_QUERY_KEY,
} from "@/lib/api/rounds-client";
import type { Round, RoundCreate } from "@/lib/api/schemas";

const mockApiClient = vi.mocked(apiClient);
const mockProblemToError = vi.mocked(problemToError);

const PLAYER_ID = "00000000-0000-4000-8000-000000000001";
const PLAYER_ID_TWO = "00000000-0000-4000-8000-000000000002";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("rounds-client", () => {
  test("exposes stable query keys", () => {
    expect(LATEST_ROUND_QUERY_KEY).toEqual(["rounds", "latest"]);
    expect(createRoundsListQueryKey()).toEqual(["rounds", "list", "default"]);
    expect(createRoundsListQueryKey(5)).toEqual(["rounds", "list", 5]);
  });

  test("fetchRounds returns data without limit", async () => {
    const rounds: Round[] = [
      {
        id: "00000000-0000-4000-8000-000000000010",
        created_at: new Date().toISOString(),
        participants: [
          { id: PLAYER_ID, display_name: "Ada", active: true },
          { id: PLAYER_ID_TWO, display_name: "Nils", active: true },
        ],
        loser: { id: PLAYER_ID, display_name: "Ada", active: true },
      },
    ];

    mockApiClient.GET.mockResolvedValueOnce({
      data: rounds,
      response: new Response(),
      error: undefined,
    });

    const result = await fetchRounds();

    expect(mockApiClient.GET).toHaveBeenCalledWith("/rounds", {
      params: {
        query: undefined,
      },
    });
    expect(result).toEqual(rounds);
  });

  test("fetchRounds includes limit when provided", async () => {
    mockApiClient.GET.mockResolvedValueOnce({
      data: [],
      response: new Response(),
      error: undefined,
    });

    await fetchRounds({ limit: 3 });

    expect(mockApiClient.GET).toHaveBeenCalledWith("/rounds", {
      params: {
        query: { limit: 3 },
      },
    });
  });

  test("fetchRounds throws when data is missing", async () => {
    mockApiClient.GET.mockResolvedValueOnce({
      data: undefined,
      response: new Response(),
      error: { detail: "Missing" },
    });

    await expect(fetchRounds()).rejects.toThrow(
      "Vi mottok et ugyldig svar da rundelisten ble lastet.",
    );
  });

  test("fetchLatestRound returns nullable data", async () => {
    mockApiClient.GET.mockResolvedValueOnce({
      data: null,
      response: new Response(),
      error: undefined,
    });

    const result = await fetchLatestRound();

    expect(mockApiClient.GET).toHaveBeenCalledWith("/rounds/latest");
    expect(result).toBeNull();
  });

  test("fetchLatestRound throws when data is undefined", async () => {
    mockApiClient.GET.mockResolvedValueOnce({
      data: undefined,
      response: new Response(),
      error: { detail: "Missing" },
    });

    await expect(fetchLatestRound()).rejects.toThrow(
      "Received an invalid response when loading latest round.",
    );
  });

  test("createRound posts a validated payload", async () => {
    const payload: RoundCreate = {
      participant_ids: [PLAYER_ID, PLAYER_ID_TWO],
      loser_id: PLAYER_ID,
    };

    mockApiClient.POST.mockResolvedValueOnce({
      data: undefined,
      response: new Response(),
      error: undefined,
    });

    await createRound(payload);

    expect(mockApiClient.POST).toHaveBeenCalledWith("/rounds", {
      body: payload,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
  });

  test("createRound surfaces API errors", async () => {
    const payload: RoundCreate = {
      participant_ids: [PLAYER_ID, PLAYER_ID_TWO],
      loser_id: PLAYER_ID,
    };
    const apiError = {
      type: "about:blank",
      title: "Bad Request",
      status: 400,
      detail: "Bad payload",
    };

    mockApiClient.POST.mockResolvedValueOnce({
      data: undefined,
      response: new Response(),
      error: apiError,
    });

    await expect(createRound(payload)).rejects.toThrow(
      "Kunne ikke lagre runden.",
    );
    expect(mockProblemToError).toHaveBeenCalledWith(
      apiError,
      "Kunne ikke lagre runden.",
    );
  });

  test("deleteRound sends path params", async () => {
    mockApiClient.DELETE.mockResolvedValueOnce({
      data: undefined,
      response: new Response(),
      error: undefined,
    });

    await deleteRound("round-1");

    expect(mockApiClient.DELETE).toHaveBeenCalledWith("/rounds/{roundId}", {
      params: {
        path: {
          roundId: "round-1",
        },
      },
      credentials: "include",
    });
  });

  test("deleteRound surfaces API errors", async () => {
    const apiError = {
      type: "about:blank",
      title: "Forbidden",
      status: 403,
      detail: "Not allowed",
    };

    mockApiClient.DELETE.mockResolvedValueOnce({
      data: undefined,
      response: new Response(),
      error: apiError,
    });

    await expect(deleteRound("round-2")).rejects.toThrow(
      "Kunne ikke slette runden.",
    );
    expect(mockProblemToError).toHaveBeenCalledWith(
      apiError,
      "Kunne ikke slette runden.",
    );
  });
});
