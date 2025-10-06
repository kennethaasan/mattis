import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

// Lazily initialize the database client. In test environments (or when
// DATABASE_URL is not provided) we avoid calling `neon()` so importing
// modules that reference `db` does not throw during tests. Any attempt to
// actually use the proxy will throw a descriptive error.

type Database = ReturnType<typeof drizzlePg>;

let dbInstance: unknown;

if (process.env.NODE_ENV === "test") {
  const url = new URL(process.env.DATABASE_URL!);
  const pool = new Pool({
    host: url.hostname,
    port: Number(url.port),
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  });
  dbInstance = drizzlePg(pool, { schema, logger: true }) as Database;
} else if (process.env.DATABASE_URL) {
  const sql = neon(process.env.DATABASE_URL);
  dbInstance = drizzleNeon(sql, { schema, logger: process.env.NODE_ENV === "development" }) as ReturnType<typeof drizzleNeon>;
} else {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get() {
      return () => {
        throw new Error(
          "No database connection string provided to `neon()`. Set the DATABASE_URL environment variable when running the application, or provide a mocked db in tests."
        );
      };
    },
  };
  dbInstance = new Proxy({}, handler) as unknown;
}

export const db = dbInstance as Database;
