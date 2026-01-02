import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { Leaderboard } from "@/components/Leaderboard";
import type {
  FettmattisLeaderboard,
  RegularLeaderboard,
} from "@/lib/leaderboard-types";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as Mock;

function createQueryResult<TData>(
  overrides: Partial<UseQueryResult<TData, Error>> = {},
) {
  return {
    data: undefined,
    error: null,
    isError: false,
    isFetching: false,
    isLoading: false,
    ...overrides,
  } as UseQueryResult<TData, Error>;
}

beforeEach(() => {
  mockedUseQuery.mockReset();
});

describe("Leaderboard component", () => {
  test("renders leaderboard entries when data is available", () => {
    mockedUseQuery
      .mockImplementationOnce(() =>
        createQueryResult<number[]>({ data: [2025, 2024] }),
      )
      .mockImplementationOnce(() =>
        createQueryResult<RegularLeaderboard>({
          data: [
            {
              playerId: "player-1",
              playerName: "Ada",
              totalLosses: 2,
              roundsPlayed: 10,
              lossPercentage: 20,
              rank: 1,
            },
          ],
        }),
      )
      .mockImplementationOnce(() =>
        createQueryResult<FettmattisLeaderboard>({
          data: [
            {
              playerId: "player-2",
              playerName: "Nils",
              fettmattisCount: 3,
              rank: 1,
            },
          ],
        }),
      );

    render(<Leaderboard />);

    expect(screen.getAllByText("Ada").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Nils").length).toBeGreaterThan(0);
    expect(screen.getByText(/Sesongoversikt/)).toBeTruthy();
  });

  test("renders empty states when no data", () => {
    mockedUseQuery
      .mockImplementationOnce(() =>
        createQueryResult<number[]>({ data: [2025] }),
      )
      .mockImplementationOnce(() =>
        createQueryResult<RegularLeaderboard>({ data: [] }),
      )
      .mockImplementationOnce(() =>
        createQueryResult<FettmattisLeaderboard>({ data: [] }),
      );

    render(<Leaderboard />);

    expect(
      screen.getAllByText("Ingen runder registrert denne sesongen ennå.")
        .length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Ingen Fettmattis utdelt i år ennå.").length,
    ).toBeGreaterThan(0);
  });
});
