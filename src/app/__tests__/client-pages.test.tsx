import type { UseQueryResult } from "@tanstack/react-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import PlayersClientPage from "@/app/players/players-client";
import RoundsClientPage from "@/app/rounds/rounds-client";
import type { Player } from "@/lib/api/players-client";
import type { Fettmattis, Round } from "@/lib/api/schemas";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

const mockUseQuery = useQuery as unknown as Mock;
const mockUseMutation = useMutation as unknown as Mock;
const mockUseQueryClient = useQueryClient as unknown as Mock;

type MutationCallbacks = {
  onSuccess?: (
    data: unknown,
    variables: unknown,
    context: unknown,
  ) => void | Promise<void>;
  onError?: (error: Error) => void;
};

function createQueryResult<TData>(
  overrides: Partial<UseQueryResult<TData, Error>> = {},
) {
  return {
    data: undefined,
    error: null,
    isError: false,
    isFetching: false,
    isLoading: false,
    refetch: vi.fn(),
    ...overrides,
  } as UseQueryResult<TData, Error>;
}

function mockMutationSequence(
  sequence: Array<{ data?: unknown; error?: Error }>,
) {
  let callIndex = 0;

  mockUseMutation.mockImplementation((options: MutationCallbacks = {}) => {
    const current = sequence[callIndex++] ?? {};

    return {
      mutateAsync: async (variables: unknown) => {
        if (current.error) {
          if (options?.onError) {
            options.onError(current.error);
          }
          throw current.error;
        }
        if (options?.onSuccess) {
          await options.onSuccess(current.data, variables, undefined);
        }
        return current.data;
      },
      isPending: false,
      variables: undefined,
    };
  });
}

beforeEach(() => {
  mockUseQuery.mockReset();
  mockUseMutation.mockReset();
  mockUseQueryClient.mockReset();
  mockUseQuery.mockReturnValue(createQueryResult());
});

afterEach(() => {
  cleanup();
});

describe("PlayersClientPage", () => {
  test("renders roster and handles updates", async () => {
    const invalidateQueries = vi.fn();
    mockUseQueryClient.mockReturnValue({ invalidateQueries });

    const players: Player[] = [
      {
        id: "00000000-0000-4000-8000-000000000001",
        display_name: "Ada",
        active: true,
      },
      {
        id: "00000000-0000-4000-8000-000000000002",
        display_name: "Nils",
        active: false,
      },
    ];
    const [firstPlayer, secondPlayer] = players;
    if (!firstPlayer || !secondPlayer) {
      throw new Error("Expected two players");
    }

    mockUseQuery.mockReturnValue(
      createQueryResult<Player[]>({
        data: players,
        isLoading: false,
        isFetching: false,
      }),
    );

    mockMutationSequence([
      { data: firstPlayer },
      { data: { ...firstPlayer, active: false } },
    ]);

    render(<PlayersClientPage />);

    expect(screen.getByText("Ada")).toBeTruthy();

    const deactivateButton = screen.getAllByRole("button", {
      name: "Sett som inaktiv",
    })[0];
    if (!deactivateButton) {
      throw new Error("Expected deactivate button");
    }
    fireEvent.click(deactivateButton);

    await waitFor(() => {
      expect(screen.getByText("Ada er nå inaktiv.")).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText("Visningsnavn"), {
      target: { value: "Nora" },
    });
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Lagre spiller" })
        .closest("form") as HTMLFormElement,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Spiller lagt til i troppen. Velkommen!"),
      ).toBeTruthy();
    });
  });

  test("renders skeletons when loading", () => {
    mockUseQueryClient.mockReturnValue({ invalidateQueries: vi.fn() });
    mockUseQuery.mockImplementationOnce(() =>
      createQueryResult<Player[]>({ isLoading: true }),
    );
    mockMutationSequence([{ data: undefined }, { data: undefined }]);

    const { container } = render(<PlayersClientPage />);

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });
});

describe("RoundsClientPage", () => {
  test("renders data and handles submissions", async () => {
    const invalidateQueries = vi.fn();
    mockUseQueryClient.mockReturnValue({ invalidateQueries });

    const players: Player[] = [
      {
        id: "00000000-0000-4000-8000-000000000011",
        display_name: "Ada",
        active: true,
      },
      {
        id: "00000000-0000-4000-8000-000000000012",
        display_name: "Nils",
        active: true,
      },
    ];
    const [firstPlayer, secondPlayer] = players;
    if (!firstPlayer || !secondPlayer) {
      throw new Error("Expected two players");
    }

    const latestRound: Round = {
      id: "00000000-0000-4000-8000-000000000100",
      created_at: new Date().toISOString(),
      participants: [
        { id: firstPlayer.id, display_name: "Ada", active: true },
        { id: secondPlayer.id, display_name: "Nils", active: true },
      ],
      loser: { id: firstPlayer.id, display_name: "Ada", active: true },
    };

    const rounds: Round[] = [latestRound];

    const fettmattis: Fettmattis[] = [
      {
        id: "00000000-0000-4000-8000-000000000200",
        created_at: new Date().toISOString(),
        player: { id: secondPlayer.id, display_name: "Nils", active: true },
        round_id: latestRound.id,
      },
    ];

    mockUseQuery.mockImplementation((options: { queryKey?: unknown }) => {
      const key = options.queryKey;

      if (Array.isArray(key) && key[0] === "players") {
        return createQueryResult<Player[]>({
          data: players,
          isLoading: false,
          isFetching: false,
        });
      }

      if (Array.isArray(key) && key[0] === "rounds" && key[1] === "latest") {
        return createQueryResult<Round | null>({ data: latestRound });
      }

      if (Array.isArray(key) && key[0] === "rounds" && key[1] === "list") {
        return createQueryResult<Round[]>({ data: rounds, isLoading: false });
      }

      if (Array.isArray(key) && key[0] === "fettmattis" && key[1] === "list") {
        return createQueryResult<Fettmattis[]>({
          data: fettmattis,
          isLoading: false,
        });
      }

      return createQueryResult();
    });

    mockMutationSequence([
      { data: undefined },
      { data: undefined },
      { data: undefined },
      { data: undefined },
    ]);

    render(<RoundsClientPage />);

    fireEvent.click(screen.getByRole("button", { name: /Ada/ }));
    fireEvent.click(screen.getByRole("button", { name: /Nils/ }));

    fireEvent.change(screen.getByLabelText("Taper"), {
      target: { value: firstPlayer.id },
    });

    fireEvent.submit(
      screen
        .getByRole("button", { name: "Lagre runde" })
        .closest("form") as HTMLFormElement,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Runde lagret. Tabellene er oppdatert!"),
      ).toBeTruthy();
    });

    const playerSelect = screen.getByLabelText("Spiller") as HTMLSelectElement;
    fireEvent.change(playerSelect, { target: { value: secondPlayer.id } });
    expect(playerSelect.value).toBe(secondPlayer.id);

    fireEvent.submit(
      screen
        .getByRole("button", { name: "Tildel Fettmattis" })
        .closest("form") as HTMLFormElement,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Fettmattis tildelt. Klar for feiring!"),
      ).toBeTruthy();
    });
  });

  test("renders loading skeletons when players are loading", () => {
    mockUseQueryClient.mockReturnValue({ invalidateQueries: vi.fn() });

    mockUseQuery
      .mockImplementationOnce(() =>
        createQueryResult<Player[]>({ isLoading: true }),
      )
      .mockImplementationOnce(() =>
        createQueryResult<Round | null>({ data: null }),
      )
      .mockImplementationOnce(() =>
        createQueryResult<Round[]>({ data: [], isLoading: false }),
      )
      .mockImplementationOnce(() =>
        createQueryResult<Fettmattis[]>({ data: [], isLoading: false }),
      );

    mockMutationSequence([
      { data: undefined },
      { data: undefined },
      { data: undefined },
      { data: undefined },
    ]);

    const { container } = render(<RoundsClientPage />);

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });
});
