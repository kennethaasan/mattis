import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const poolConstructor = vi.fn(() => ({ pool: true }));
const drizzleConstructor = vi.fn(() => ({ db: true }));

vi.mock("pg", () => ({
  Pool: poolConstructor,
}));

vi.mock("drizzle-orm/node-postgres", () => ({
  drizzle: drizzleConstructor,
}));

beforeEach(() => {
  vi.stubEnv("DATABASE_URL", "postgres://user:pass@localhost:5432/mattis");
  vi.stubEnv("BETTER_AUTH_SECRET", "x".repeat(32));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  poolConstructor.mockClear();
  drizzleConstructor.mockClear();
});

describe("db", () => {
  test("creates pool and drizzle with development logger", async () => {
    vi.stubEnv("NODE_ENV", "development");

    const { db } =
      await vi.importActual<typeof import("@/lib/db/db")>("@/lib/db/db");

    expect(db).toEqual({ db: true });
    expect(poolConstructor).toHaveBeenCalledWith({
      connectionString: process.env.DATABASE_URL,
    });
    expect(drizzleConstructor).toHaveBeenCalledWith({
      client: poolConstructor.mock.results[0]?.value,
      schema: expect.any(Object),
      logger: true,
      casing: "snake_case",
    });
  });

  test("disables logger outside development", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await vi.importActual<typeof import("@/lib/db/db")>("@/lib/db/db");

    expect(drizzleConstructor).toHaveBeenCalledWith({
      client: poolConstructor.mock.results[0]?.value,
      schema: expect.any(Object),
      logger: false,
      casing: "snake_case",
    });
  });
});
