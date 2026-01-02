import { APIError } from "better-auth";
import { beforeEach, describe, expect, test, vi } from "vitest";

// Unmock the authorize module since setup.ts mocks it globally
vi.unmock("@/lib/auth/authorize");

// Mock the auth module with a factory that returns a dynamic mock
vi.mock("@/lib/auth/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Mock the logger
vi.mock("@/lib/observability/powertools", () => ({
  logger: {
    warn: vi.fn(),
  },
}));

// Import after mocks are set up
import { auth } from "@/lib/auth/auth";
import {
  authenticateRequest,
  requireAuthenticatedRequest,
} from "@/lib/auth/authorize";
import { logger } from "@/lib/observability/powertools";

// Get the mocked functions
// biome-ignore lint/suspicious/noExplicitAny: Vitest mock type is complex, using any for test simplicity
const mockGetSession = auth.api.getSession as any;
// biome-ignore lint/suspicious/noExplicitAny: Vitest mock type is complex, using any for test simplicity
const mockLoggerWarn = logger.warn as any;

describe("authorize", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("authenticateRequest", () => {
    test("returns success with session when authenticated", async () => {
      const mockSession = {
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
        },
        session: {
          id: "session-123",
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      };

      mockGetSession.mockResolvedValueOnce(mockSession);

      const headers = new Headers();
      const result = await authenticateRequest(headers);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.user).toEqual(mockSession.user);
        expect(result.value.session).toEqual(mockSession.session);
      }
    });

    test("returns failure with 401 when no session", async () => {
      mockGetSession.mockResolvedValueOnce(null);

      const headers = new Headers();
      const result = await authenticateRequest(headers);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.response.status).toBe(401);
        const text = await result.response.text();
        expect(text).toBe("Authentication required.");
      }
    });

    test("returns failure when APIError is thrown", async () => {
      mockGetSession.mockRejectedValueOnce(
        new APIError("UNAUTHORIZED", { message: "Invalid token" }),
      );

      const headers = new Headers();
      const result = await authenticateRequest(headers);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.response.status).toBe(401);
      }
    });

    test("rethrows non-APIError errors", async () => {
      const customError = new Error("Database connection failed");
      mockGetSession.mockRejectedValueOnce(customError);

      const headers = new Headers();

      await expect(authenticateRequest(headers)).rejects.toThrow(
        "Database connection failed",
      );
    });

    test("passes headers and disableRefresh query to getSession", async () => {
      const mockSession = {
        user: { id: "user-123", email: "test@example.com", name: "Test User" },
        session: { id: "session-123", expiresAt: new Date() },
      };

      mockGetSession.mockResolvedValueOnce(mockSession);

      const headers = new Headers();
      headers.set("Cookie", "session=abc123");

      await authenticateRequest(headers);

      expect(mockGetSession).toHaveBeenCalledWith({
        headers,
        query: {
          disableRefresh: true,
        },
      });
    });
  });

  describe("requireAuthenticatedRequest", () => {
    test("returns authenticated user when session exists", async () => {
      const mockSession = {
        user: {
          id: "user-456",
          email: "authenticated@example.com",
          name: "Auth User",
        },
        session: {
          id: "session-456",
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      };

      mockGetSession.mockResolvedValueOnce(mockSession);

      const headers = new Headers();
      const result = await requireAuthenticatedRequest(headers);

      expect(result).toBeDefined();
      expect(result?.user).toEqual(mockSession.user);
      expect(result?.session).toEqual(mockSession.session);
    });

    test("returns undefined and logs warning when not authenticated", async () => {
      mockGetSession.mockResolvedValueOnce(null);

      const headers = new Headers();
      const result = await requireAuthenticatedRequest(headers);

      expect(result).toBeUndefined();
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        "Unauthorized request",
        expect.objectContaining({
          response: expect.any(Object),
        }),
      );
    });

    test("returns undefined when APIError is thrown", async () => {
      mockGetSession.mockRejectedValueOnce(
        new APIError("FORBIDDEN", { message: "Access denied" }),
      );

      const headers = new Headers();
      const result = await requireAuthenticatedRequest(headers);

      expect(result).toBeUndefined();
      expect(mockLoggerWarn).toHaveBeenCalled();
    });
  });
});
