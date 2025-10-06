import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

function getFetchImplementation(): (input: string, init?: RequestInit) => Promise<Response> {
  if (typeof fetch !== "undefined") {
    return fetch.bind(globalThis) as (input: string, init?: RequestInit) => Promise<Response>;
  }

  throw new Error(
    "No global `fetch` available. Ensure your runtime provides `fetch` or provide a fetch implementation for the Neon client."
  );
}

const sql = neon(process.env.DATABASE_URL!, { fetch: getFetchImplementation() });

export const db = drizzle(sql, { schema, logger: process.env.NODE_ENV === "development" });
