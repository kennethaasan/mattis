import { beforeEach, describe, expect, test, vi } from "vitest";

const { mockToNextJsHandler, mockGet, mockPost } = vi.hoisted(() => ({
  mockToNextJsHandler: vi.fn(),
  mockGet: vi.fn(),
  mockPost: vi.fn(),
}));

vi.mock("better-auth/next-js", () => ({
  toNextJsHandler: (...args: unknown[]) => {
    mockToNextJsHandler(...args);
    return { GET: mockGet, POST: mockPost };
  },
}));

vi.mock("@/lib/auth/auth", () => ({
  auth: { id: "auth" },
}));

beforeEach(() => {
  vi.resetModules();
});

describe("auth route", () => {
  test("exports handlers from better-auth", async () => {
    const { GET, POST } = await import("@/app/api/auth/[...better-auth]/route");

    expect(mockToNextJsHandler).toHaveBeenCalledWith({ id: "auth" });
    expect(GET).toBe(mockGet);
    expect(POST).toBe(mockPost);
  });
});
