import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";

const { mockUseSession, mockSignInEmail, mockSignOut } = vi.hoisted(() => ({
  mockUseSession: vi.fn(),
  mockSignInEmail: vi.fn(),
  mockSignOut: vi.fn(),
}));

vi.mock("@/lib/auth/auth-client", () => ({
  useSession: mockUseSession,
  signIn: { email: mockSignInEmail },
  signOut: mockSignOut,
}));

afterEach(() => {
  cleanup();
});

function AuthHarness() {
  const { user, error, loading, login, logout } = useAuth();

  return (
    <div>
      <span data-testid="user">{user?.name ?? "none"}</span>
      <span data-testid="loading">{loading ? "loading" : "ready"}</span>
      <span data-testid="error">{error ?? ""}</span>
      <button
        type="button"
        onClick={() => {
          void login({ email: "user@example.com", password: "secret" }).catch(
            () => undefined,
          );
        }}
      >
        Login
      </button>
      <button
        type="button"
        onClick={() => {
          void logout();
        }}
      >
        Logout
      </button>
    </div>
  );
}

describe("AuthContext", () => {
  test("derives user name from email when missing", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "user-1", email: "user@example.com", name: null },
      },
      isPending: false,
      error: null,
    });

    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>,
    );

    expect(screen.getByTestId("user").textContent).toBe("user@example.com");
    expect(screen.getByTestId("loading").textContent).toBe("ready");
  });

  test("surfaces login errors", async () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
      error: null,
    });
    mockSignInEmail.mockResolvedValue({
      error: { message: "Feil e-post eller passord." },
    });

    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(screen.getByTestId("error").textContent).toBe(
        "Feil e-post eller passord.",
      );
    });
  });

  test("captures logout errors", async () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
      error: null,
    });
    mockSignOut.mockRejectedValue(new Error("Kunne ikke logge ut."));

    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => {
      expect(screen.getByTestId("error").textContent).toBe(
        "Kunne ikke logge ut.",
      );
    });
  });
});
