import { describe, expect, test, vi } from "vitest";

import PlayersPage from "@/app/players/page";
import RoundsPage from "@/app/rounds/page";

const { mockGetSession, mockHeaders, mockRedirect } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockHeaders: vi.fn(),
  mockRedirect: vi.fn(),
}));

vi.mock("@/lib/auth/auth", () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: mockHeaders,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

describe("server pages", () => {
  test("redirects unauthenticated users from players page", async () => {
    mockHeaders.mockResolvedValue(new Headers());
    mockGetSession.mockResolvedValue(null);

    await PlayersPage();

    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  test("renders players client page when authenticated", async () => {
    mockHeaders.mockResolvedValue(new Headers());
    mockGetSession.mockResolvedValue({ user: { id: "user" } });

    const result = await PlayersPage();

    expect(result).toBeTruthy();
  });

  test("redirects unauthenticated users from rounds page", async () => {
    mockHeaders.mockResolvedValue(new Headers());
    mockGetSession.mockResolvedValue(null);

    await RoundsPage();

    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  test("renders rounds client page when authenticated", async () => {
    mockHeaders.mockResolvedValue(new Headers());
    mockGetSession.mockResolvedValue({ user: { id: "user" } });

    const result = await RoundsPage();

    expect(result).toBeTruthy();
  });
});
