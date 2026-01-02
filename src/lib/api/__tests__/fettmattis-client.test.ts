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
  createFettMattis,
  createFettMattisListQueryKey,
  fetchFettMattis,
  revokeFettMattis,
} from "@/lib/api/fettmattis-client";
import type { FettMattis, FettMattisCreate } from "@/lib/api/schemas";

const mockApiClient = vi.mocked(apiClient);
const mockProblemToError = vi.mocked(problemToError);

const PLAYER_ID = "00000000-0000-4000-8000-000000000001";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fettmattis-client", () => {
  test("creates stable list query keys", () => {
    expect(createFettMattisListQueryKey()).toEqual([
      "fettmattis",
      "list",
      "default",
    ]);
    expect(createFettMattisListQueryKey(10)).toEqual([
      "fettmattis",
      "list",
      10,
    ]);
  });

  test("fetchFettMattis returns data", async () => {
    const entries: FettMattis[] = [
      {
        id: "00000000-0000-4000-8000-000000000011",
        created_at: new Date().toISOString(),
        player: { id: PLAYER_ID, display_name: "Ada", active: true },
      },
    ];

    mockApiClient.GET.mockResolvedValueOnce({
      data: entries,
      response: new Response(),
      error: undefined,
    });

    const result = await fetchFettMattis();

    expect(mockApiClient.GET).toHaveBeenCalledWith("/fettmattis", {
      params: {
        query: undefined,
      },
    });
    expect(result).toEqual(entries);
  });

  test("fetchFettMattis includes limit", async () => {
    mockApiClient.GET.mockResolvedValueOnce({
      data: [],
      response: new Response(),
      error: undefined,
    });

    await fetchFettMattis({ limit: 2 });

    expect(mockApiClient.GET).toHaveBeenCalledWith("/fettmattis", {
      params: {
        query: { limit: 2 },
      },
    });
  });

  test("fetchFettMattis throws when data is missing", async () => {
    mockApiClient.GET.mockResolvedValueOnce({
      data: undefined,
      response: new Response(),
      error: { detail: "Missing" },
    });

    await expect(fetchFettMattis()).rejects.toThrow(
      "Vi mottok et ugyldig svar da FettMattis-listen ble lastet.",
    );
  });

  test("createFettMattis posts validated payload", async () => {
    const payload: FettMattisCreate = {
      player_id: PLAYER_ID,
      round_id: "00000000-0000-4000-8000-000000000022",
    };

    mockApiClient.POST.mockResolvedValueOnce({
      data: undefined,
      response: new Response(),
      error: undefined,
    });

    await createFettMattis(payload);

    expect(mockApiClient.POST).toHaveBeenCalledWith("/fettmattis", {
      body: payload,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
  });

  test("createFettMattis surfaces API errors", async () => {
    const payload: FettMattisCreate = {
      player_id: PLAYER_ID,
    };
    const apiError = {
      type: "about:blank",
      title: "Forbidden",
      status: 403,
      detail: "Not allowed",
    };

    mockApiClient.POST.mockResolvedValueOnce({
      data: undefined,
      response: new Response(),
      error: apiError,
    });

    await expect(createFettMattis(payload)).rejects.toThrow(
      "Kunne ikke tildele en Fettmattis.",
    );
    expect(mockProblemToError).toHaveBeenCalledWith(
      apiError,
      "Kunne ikke tildele en Fettmattis.",
    );
  });

  test("revokeFettMattis sends path params", async () => {
    mockApiClient.DELETE.mockResolvedValueOnce({
      data: undefined,
      response: new Response(),
      error: undefined,
    });

    await revokeFettMattis("fett-1");

    expect(mockApiClient.DELETE).toHaveBeenCalledWith(
      "/fettmattis/{fettmattisId}",
      {
        params: {
          path: {
            fettmattisId: "fett-1",
          },
        },
        credentials: "include",
      },
    );
  });

  test("revokeFettMattis surfaces API errors", async () => {
    const apiError = {
      type: "about:blank",
      title: "Not Found",
      status: 404,
      detail: "Missing",
    };

    mockApiClient.DELETE.mockResolvedValueOnce({
      data: undefined,
      response: new Response(),
      error: apiError,
    });

    await expect(revokeFettMattis("fett-2")).rejects.toThrow(
      "Kunne ikke slette Fettmattis.",
    );
    expect(mockProblemToError).toHaveBeenCalledWith(
      apiError,
      "Kunne ikke slette Fettmattis.",
    );
  });
});
