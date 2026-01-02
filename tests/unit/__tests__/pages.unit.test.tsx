import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";

import LeaderboardPage from "@/app/leaderboard/page";
import LoginPage from "@/app/login/page";
import Home from "@/app/page";

const {
  mockUseAuth,
  mockReplace,
  mockGetOverviewStats,
  mockListRecentRounds,
  mockListRecentFettMattis,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockReplace: vi.fn(),
  mockGetOverviewStats: vi.fn(),
  mockListRecentRounds: vi.fn(),
  mockListRecentFettMattis: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  redirect: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/components/Leaderboard", () => ({
  Leaderboard: () => <div data-testid="leaderboard" />,
}));

vi.mock("@/lib/db-client", () => ({
  getOverviewStats: mockGetOverviewStats,
  listRecentRounds: mockListRecentRounds,
  listRecentFettMattis: mockListRecentFettMattis,
}));

vi.mock("next/server", () => ({
  connection: vi.fn().mockResolvedValue(undefined),
}));

afterEach(() => {
  cleanup();
});

describe("LoginPage", () => {
  test("redirects when user is already authenticated", async () => {
    mockUseAuth.mockReturnValue({
      login: vi.fn(),
      user: { id: "user", email: "user@example.com", name: "User" },
      loading: false,
      error: null,
    });

    render(<LoginPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/rounds");
    });
  });

  test("submits login credentials and navigates", async () => {
    const login = vi.fn().mockResolvedValue(undefined);

    mockUseAuth.mockReturnValue({
      login,
      user: null,
      loading: false,
      error: null,
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("E-post"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Passord"), {
      target: { value: "secret" },
    });

    fireEvent.submit(
      screen
        .getByRole("button", { name: "Logg inn" })
        .closest("form") as HTMLFormElement,
    );

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "secret",
      });
      expect(mockReplace).toHaveBeenCalledWith("/rounds");
    });
  });

  test("shows error message on login failure", async () => {
    const login = vi
      .fn()
      .mockRejectedValue(new Error("Feil e-post eller passord."));

    mockUseAuth.mockReturnValue({
      login,
      user: null,
      loading: false,
      error: null,
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("E-post"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Passord"), {
      target: { value: "wrong" },
    });

    fireEvent.submit(
      screen
        .getByRole("button", { name: "Logg inn" })
        .closest("form") as HTMLFormElement,
    );

    expect(await screen.findByText("Feil e-post eller passord.")).toBeTruthy();
  });
});

describe("LeaderboardPage", () => {
  test("renders header and leaderboard", () => {
    render(<LeaderboardPage />);

    expect(screen.getByText("Tabeller")).toBeTruthy();
    expect(screen.getByTestId("leaderboard")).toBeTruthy();
  });
});

describe("Home page", () => {
  test("renders highlights from overview stats", async () => {
    mockGetOverviewStats.mockResolvedValue({
      totalRounds: 12,
      fettMattisMoments: 3,
      activePlayers: 4,
    });

    mockListRecentRounds.mockResolvedValue([
      {
        id: "round-1",
        createdAt: new Date("2025-01-01T00:00:00Z"),
        createdBy: "user-1",
        deletedAt: null,
        participants: [
          { id: "p1", displayName: "Ada", active: true },
          { id: "p2", displayName: "Nils", active: true },
        ],
        loser: { id: "p1", displayName: "Ada", active: true },
      },
    ]);

    mockListRecentFettMattis.mockResolvedValue([
      {
        id: "fm-1",
        player: { id: "p2", displayName: "Nils", active: true },
        createdAt: new Date("2025-01-02T00:00:00Z"),
        createdBy: "user-1",
        revokedAt: null,
        roundId: "round-1",
      },
    ]);

    const element = await Home();
    render(element);

    expect(screen.getByText("Hold oversikt over sesongen")).toBeTruthy();
    expect(screen.getByText("Registrerte runder")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getByText("Fettmattis-øyeblikk")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("Aktive spillere")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
  });
});
