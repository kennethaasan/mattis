import { beforeEach, describe, expect, test, vi } from "vitest";

const { mockCreateAuthClient, mockUseSession, mockSignInEmail, mockSignOut } =
  vi.hoisted(() => ({
    mockCreateAuthClient: vi.fn(),
    mockUseSession: vi.fn(),
    mockSignInEmail: vi.fn(),
    mockSignOut: vi.fn(),
  }));

vi.mock("better-auth/react", () => ({
  createAuthClient: (...args: unknown[]) => {
    mockCreateAuthClient(...args);
    return {
      useSession: mockUseSession,
      signIn: { email: mockSignInEmail },
      signOut: mockSignOut,
    };
  },
}));

vi.mock("@/lib/api/amz-content-sha256", () => ({
  amzContentSha256FetchPlugin: { id: "amz", name: "amz" },
}));

beforeEach(() => {
  vi.resetModules();
});

describe("auth-client", () => {
  test("creates auth client with amz content hash plugin", async () => {
    await import("@/lib/auth/auth-client");

    expect(mockCreateAuthClient).toHaveBeenCalledWith({
      fetchOptions: {
        plugins: [{ id: "amz", name: "amz" }],
      },
    });
  });

  test("re-exports auth client helpers", async () => {
    const { authClient, signIn, signOut, useSession } = await import(
      "@/lib/auth/auth-client"
    );

    expect(authClient.useSession).toBe(mockUseSession);
    expect(useSession).toBe(mockUseSession);
    expect(signIn.email).toBe(mockSignInEmail);
    expect(signOut).toBe(mockSignOut);
  });
});
