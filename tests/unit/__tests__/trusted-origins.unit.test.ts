import { beforeEach, describe, expect, test, vi } from "vitest";

// Mock the env module before importing trusted-origins
vi.mock("@/env", () => ({
  env: {
    NEXT_PUBLIC_APP_URL: "https://app.example.com",
    BETTER_AUTH_URL: "https://auth.example.com",
    BETTER_AUTH_TRUSTED_ORIGINS: "https://trusted1.com, https://trusted2.com",
  },
  config: {
    IS_DEVELOPMENT: false,
    IS_TEST: true, // Test environment includes localhost
  },
}));

import { getTrustedOrigins } from "@/lib/auth/trusted-origins";

describe("getTrustedOrigins", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test("returns static trusted origins", () => {
    const origins = getTrustedOrigins();

    expect(origins).toContain("https://app.example.com");
    expect(origins).toContain("https://auth.example.com");
    expect(origins).toContain("https://mattis.aws.aasan.dev");
    expect(origins).toContain("https://mattis.vanvikil.no");
  });

  test("returns additional trusted origins from env", () => {
    const origins = getTrustedOrigins();

    expect(origins).toContain("https://trusted1.com");
    expect(origins).toContain("https://trusted2.com");
  });

  test("includes localhost in test environment", () => {
    const origins = getTrustedOrigins();

    expect(origins).toContain("http://localhost:3000");
    expect(origins).toContain("http://127.0.0.1:3000");
  });

  test("adds origin header from request", () => {
    const request = new Request("https://example.com/api/test", {
      headers: {
        origin: "https://custom-origin.com",
      },
    });

    const origins = getTrustedOrigins(request);

    expect(origins).toContain("https://custom-origin.com");
  });

  test("adds request URL origin", () => {
    const request = new Request("https://request-url.com/api/path");

    const origins = getTrustedOrigins(request);

    expect(origins).toContain("https://request-url.com");
  });

  test("handles request without origin header", () => {
    const request = new Request("https://example.com/api/test");

    const origins = getTrustedOrigins(request);

    // Should include the request URL origin
    expect(origins).toContain("https://example.com");
    // Static origins should still be present
    expect(origins).toContain("https://app.example.com");
  });

  test("deduplicates origins", () => {
    const request = new Request("https://app.example.com/api/test", {
      headers: {
        origin: "https://app.example.com",
      },
    });

    const origins = getTrustedOrigins(request);

    // Count occurrences of the duplicated origin
    const count = origins.filter((o) => o === "https://app.example.com").length;
    expect(count).toBe(1);
  });
});

describe("getTrustedOrigins in development", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test("includes localhost in development environment", async () => {
    vi.doMock("@/env", () => ({
      env: {
        NEXT_PUBLIC_APP_URL: "https://app.example.com",
        BETTER_AUTH_URL: undefined,
        BETTER_AUTH_TRUSTED_ORIGINS: "",
      },
      config: {
        IS_DEVELOPMENT: true,
        IS_TEST: false,
      },
    }));

    const { getTrustedOrigins: getTrustedOriginsDev } = await import(
      "@/lib/auth/trusted-origins"
    );

    const origins = getTrustedOriginsDev();

    expect(origins).toContain("http://localhost:3000");
    expect(origins).toContain("http://127.0.0.1:3000");
  });
});

describe("getTrustedOrigins in production", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test("excludes localhost in production environment", async () => {
    vi.doMock("@/env", () => ({
      env: {
        NEXT_PUBLIC_APP_URL: "https://app.example.com",
        BETTER_AUTH_URL: undefined,
        BETTER_AUTH_TRUSTED_ORIGINS: "",
      },
      config: {
        IS_DEVELOPMENT: false,
        IS_TEST: false,
      },
    }));

    const { getTrustedOrigins: getTrustedOriginsProd } = await import(
      "@/lib/auth/trusted-origins"
    );

    const origins = getTrustedOriginsProd();

    expect(origins).not.toContain("http://localhost:3000");
    expect(origins).not.toContain("http://127.0.0.1:3000");
  });
});
