/* biome-ignore lint/suspicious/noExplicitAny: This is a test mock file */
import type { UseQueryResult } from "@tanstack/react-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { toast } from "sonner";
import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    mutate: vi.fn(),
    isPending: false,
    variables: undefined,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
  })),
}));

import PlayersClientPage from "@/app/players/players-client";
import RoundsClientPage from "@/app/rounds/rounds-client";
import type { Player } from "@/lib/api/players-client";
import type { Fettmattis, Round } from "@/lib/api/schemas";

const mockUseQuery = useQuery as unknown as Mock;
const mockUseMutation = useMutation as unknown as Mock;
const mockUseQueryClient = useQueryClient as unknown as Mock;

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

beforeEach(() => {
  vi.clearAllMocks();
  mockUseQuery.mockReturnValue(createQueryResult());
  mockUseMutation.mockReturnValue({
    mutateAsync: vi.fn(),
    mutate: vi.fn(),
    isPending: false,
    variables: undefined,
  });
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

    mockUseQuery.mockReturnValue(
      createQueryResult<Player[]>({
        data: players,
        isLoading: false,
        isFetching: false,
      }),
    );

    mockUseMutation.mockImplementation((options: any) => ({
      mutateAsync: async (variables: any) => {
        const result = variables.payload
          ? {
              ...players.find((p) => p.id === variables.playerId),
              ...variables.payload,
            }
          : {
              id: "00000000-0000-4000-8000-000000000003",
              display_name: "Nora",
              active: true,
            };

        if (options.onSuccess) await options.onSuccess(result, variables);
        return result;
      },
      isPending: false,
    }));

    render(<PlayersClientPage />);

    expect(screen.getByText("Ada")).toBeTruthy();

    const deactivateButton = screen.getAllByRole("button", {
      name: "Sett som inaktiv",
    })[0];
    if (deactivateButton) {
      fireEvent.click(deactivateButton);
    }

    const confirmButton = screen.getByRole("button", { name: "Bekreft" });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("Ada er nå inaktiv"),
      );
    });

    expect(invalidateQueries).toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Visningsnavn"), {
      target: { value: "Nora" },
    });
    const saveButton = screen.getByRole("button", { name: "Lagre spiller" });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Spiller lagt til i troppen. Velkommen!",
      );
    });

    expect(invalidateQueries).toHaveBeenCalled();
  });

  test("renders skeletons when loading", () => {
    mockUseQuery.mockReturnValue(
      createQueryResult<Player[]>({ isLoading: true }),
    );
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

    const p1Id = "00000000-0000-4000-8000-000000000011";
    const p2Id = "00000000-0000-4000-8000-000000000012";
    const r1Id = "00000000-0000-4000-8000-000000000100";
    const f1Id = "00000000-0000-4000-8000-000000000200";

    const testPlayers: Player[] = [
      { id: p1Id, display_name: "Ada", active: true },
      { id: p2Id, display_name: "Nils", active: true },
    ];

    const testRound: Round = {
      id: r1Id,
      created_at: new Date().toISOString(),
      participants: testPlayers,
      loser: testPlayers[0]!,
    };

    const testFettmattis: Fettmattis = {
      id: f1Id,
      created_at: new Date().toISOString(),
      player: testPlayers[1]!,
      round_id: testRound.id,
    };

    mockUseQuery.mockImplementation((options: any) => {
      const key = options.queryKey;
      if (key[0] === "players") return createQueryResult({ data: testPlayers });
      if (key[0] === "rounds" && key[1] === "latest")
        return createQueryResult({ data: testRound });
      if (key[0] === "rounds" && key[1] === "list")
        return createQueryResult({ data: [testRound] });
      if (key[0] === "fettmattis" && key[1] === "list")
        return createQueryResult({ data: [testFettmattis] });
      return createQueryResult();
    });

    mockUseMutation.mockImplementation((options: any) => ({
      mutateAsync: async (variables: any) => {
        if (options.onSuccess) await options.onSuccess(undefined, variables);
        return undefined;
      },
      isPending: false,
    }));

    render(<RoundsClientPage />);

    // Award Fettmattis
    const playerSelect = screen.getByLabelText("Spiller");
    fireEvent.change(playerSelect, {
      target: { value: p2Id },
    });
    const tildelButton = screen.getByRole("button", {
      name: "Tildel Fettmattis",
    });
    fireEvent.click(tildelButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Fettmattis tildelt. Klar for feiring!",
        expect.any(Object),
      );
    });

    // Save round
    const adaBtn = screen.getByRole("button", { name: /Ada/ });
    const nilsBtn = screen.getByRole("button", { name: /Nils/ });
    fireEvent.click(adaBtn);
    fireEvent.click(nilsBtn);

    // Select loser
    const loserSelect = screen.getByLabelText("Taper");
    fireEvent.change(loserSelect, {
      target: { value: p1Id },
    });

    const saveRoundButton = screen.getByRole("button", { name: "Lagre runde" });
    fireEvent.click(saveRoundButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Runde lagret. Tabellene er oppdatert!",
        expect.any(Object),
      );
    });
  });

  test("renders loading skeletons when players are loading", () => {
    mockUseQuery.mockReturnValue(
      createQueryResult<Player[]>({ isLoading: true }),
    );
    const { container } = render(<RoundsClientPage />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });
});
