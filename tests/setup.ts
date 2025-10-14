import { vi } from "vitest";

// Set baseline environment variables for tests before modules import.
vi.stubEnv("DATABASE_URL", "postgresql://mattis:mattis@localhost:5432/mattis");
vi.stubEnv("BASIC_AUTH_USERNAME", "admin");
vi.stubEnv("BASIC_AUTH_PASSWORD", "admin");
vi.stubEnv("BASIC_AUTH_USER_ID", "00000000-0000-7000-8000-000000000000");

import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "@/lib/db/schema";

// This is based on https://github.com/drizzle-team/drizzle-orm/issues/4205
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
  // biome-ignore lint/suspicious/noExplicitAny: drizzle's helper expects a loosely typed client
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
