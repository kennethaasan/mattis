import { beforeEach, describe, expect, test, vi } from "vitest";

const { nextResponseNext, mockAuthenticateRequest, mockGetTrustedOrigins } =
  vi.hoisted(() => ({
    nextResponseNext: vi.fn(),
    mockAuthenticateRequest: vi.fn(),
    mockGetTrustedOrigins: vi.fn(),
  }));

vi.mock("next/server", () => {
  class MockNextResponse extends Response {
    static next = nextResponseNext;
  }

  return {
    NextResponse: MockNextResponse,
  };
});

vi.mock("@/lib/auth/authorize", () => ({
  authenticateRequest: mockAuthenticateRequest,
}));

vi.mock("@/lib/auth/trusted-origins", () => ({
  getTrustedOrigins: mockGetTrustedOrigins,
}));

import { NextResponse } from "next/server";
import { proxy } from "@/proxy";

const mockNextResponseNext = vi.mocked(NextResponse.next);

function createRequest({
  method = "GET",
  origin,
  pathname = "/api/players",
}: {
  method?: string;
  origin?: string;
  pathname?: string;
} = {}) {
  const headers = new Headers();
  if (origin) {
    headers.set("origin", origin);
  }

  return {
    method,
    headers,
    nextUrl: { pathname },
    url: `http://localhost:3000${pathname}`,
  } as unknown as import("next/server").NextRequest;
}

beforeEach(() => {
  mockNextResponseNext.mockReset();
  mockAuthenticateRequest.mockReset();
  mockGetTrustedOrigins.mockReset();
  mockNextResponseNext.mockImplementation(
    () => new NextResponse(null, { status: 200 }),
  );
});

describe("proxy", () => {
  test("returns preflight response for OPTIONS", async () => {
    mockGetTrustedOrigins.mockReturnValue(["http://example.com"]);

    const response = await proxy(
      createRequest({ method: "OPTIONS", origin: "http://example.com" }),
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe(
      "http://example.com",
    );
    expect(mockAuthenticateRequest).not.toHaveBeenCalled();
  });

  test("skips authentication for auth paths", async () => {
    mockGetTrustedOrigins.mockReturnValue(["http://example.com"]);

    await proxy(
      createRequest({
        method: "POST",
        origin: "http://example.com",
        pathname: "/api/auth/session",
      }),
    );

    expect(mockAuthenticateRequest).not.toHaveBeenCalled();
    expect(mockNextResponseNext).toHaveBeenCalled();
  });

  test("skips authentication for non-protected methods", async () => {
    mockGetTrustedOrigins.mockReturnValue(["http://example.com"]);

    await proxy(createRequest({ method: "GET", origin: "http://example.com" }));

    expect(mockAuthenticateRequest).not.toHaveBeenCalled();
    expect(mockNextResponseNext).toHaveBeenCalled();
  });

  test("returns auth failure response when authentication fails", async () => {
    mockGetTrustedOrigins.mockReturnValue(["http://example.com"]);
    const failureResponse = new NextResponse("unauthorized", { status: 401 });

    mockAuthenticateRequest.mockResolvedValueOnce({
      ok: false,
      response: failureResponse,
    });

    const response = await proxy(
      createRequest({ method: "POST", origin: "http://example.com" }),
    );

    expect(mockAuthenticateRequest).toHaveBeenCalled();
    expect(response.status).toBe(401);
    expect(response.headers.get("access-control-allow-origin")).toBe(
      "http://example.com",
    );
  });

  test("adds authenticated headers on success", async () => {
    mockGetTrustedOrigins.mockReturnValue(["http://example.com"]);
    mockAuthenticateRequest.mockResolvedValueOnce({
      ok: true,
      value: {
        user: {
          id: "user-1",
          email: "user@example.com",
          name: "User",
        },
      },
    });

    await proxy(
      createRequest({ method: "POST", origin: "http://example.com" }),
    );

    const nextCallArgs = mockNextResponseNext.mock.calls[0]?.[0];
    const requestHeaders = nextCallArgs?.request?.headers;
    expect(requestHeaders?.get("x-authenticated-user-id")).toBe("user-1");
    expect(requestHeaders?.get("x-authenticated-user-email")).toBe(
      "user@example.com",
    );
    expect(requestHeaders?.get("x-authenticated-user-name")).toBe("User");
  });
});
