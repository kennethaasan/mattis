import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { Mock } from "vitest";
import { beforeEach, expect, test, vi } from "vitest";

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

test("renders error panel for failed leaderboard queries", () => {
  const regularError = new Error("Kunne ikke hente vanlige resultater");

  mockedUseQuery.mockImplementationOnce(() =>
    createQueryResult<number[]>({
      data: [2025],
    }),
  );

  mockedUseQuery.mockImplementationOnce(() =>
    createQueryResult<RegularLeaderboard>({
      isError: true,
      error: regularError,
    }),
  );

  mockedUseQuery.mockImplementationOnce(() =>
    createQueryResult<FettmattisLeaderboard>({
      data: [],
    }),
  );

  render(<Leaderboard />);

  const inlineErrors = screen.getAllByText(
    "Kunne ikke laste vanlige resultater. Prøv igjen senere.",
  );
  const bannerError = screen.getByText("Kunne ikke hente vanlige resultater");

  expect(inlineErrors.length).toBeGreaterThan(0);
  expect(bannerError).toBeDefined();
  expect(
    screen.queryByText("Ingen runder registrert denne sesongen ennå."),
  ).toBeNull();
});
