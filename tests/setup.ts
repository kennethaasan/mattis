/* eslint-disable @typescript-eslint/consistent-type-imports */

import { vi } from "vitest";

// Set baseline environment variables for tests before modules import.
vi.stubEnv("DATABASE_URL", "postgresql://mattis:mattis@localhost:5432/mattis");
vi.stubEnv("BASIC_AUTH_USERNAME", "admin");
vi.stubEnv("BASIC_AUTH_PASSWORD", "admin");
vi.stubEnv("BASIC_AUTH_USER_ID", "00000000-0000-7000-8000-000000000000");

import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "@/lib/db/schema";

vi.mock("@/lib/db/db", async () => {
  const { createRequire } =
    await vi.importActual<typeof import("node:module")>("node:module");

  const require = createRequire(import.meta.url);

  const { pushSchema } =
    require("drizzle-kit/api") as typeof import("drizzle-kit/api");

  const client = new PGlite();
  const db = drizzle({
    client,
    schema,
    casing: "snake_case",
  });

  // apply schema to db
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
  const { apply } = await pushSchema(schema, db as any);
  await apply();

  // now we can seed some data
  const { env } = await import("@/env");
  await db.insert(schema.users).values([
    {
      id: env.BASIC_AUTH_USER_ID,
      username: env.BASIC_AUTH_USERNAME,
    },
  ]);

  return {
    db,
  };
});
