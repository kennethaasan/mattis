import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Provide a Postgres connection string in the environment.");
}

const pool = new Pool({
  connectionString,
});

export const db = drizzle(pool, {
  schema,
  logger: process.env.NODE_ENV === "development",
});
