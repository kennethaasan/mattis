import { randomUUID } from "node:crypto";
import path from "node:path";

import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { DataType, newDb } from "pg-mem";
import type { Pool } from "pg";

import * as schema from "@/lib/db/schema";

export interface TestDatabaseContext {
  db: NodePgDatabase<typeof schema>;
  pool: Pool;
  reset: () => Promise<void>;
  close: () => Promise<void>;
}

export async function createTestDatabase(): Promise<TestDatabaseContext> {
  const pg = newDb({ autoCreateForeignKeyIndices: true });

  pg.public.registerFunction({
    name: "gen_random_uuid",
    returns: DataType.uuid,
    implementation: randomUUID,
  });

  const adapter = pg.adapters.createPg();
  const PgPool = adapter.Pool as unknown as typeof Pool;
  const pool = new PgPool();

  type QueryResultShape = { rows?: unknown[]; fields?: Array<{ name: string }> };
  const baseQuery = pool.query.bind(pool) as (...args: unknown[]) => Promise<QueryResultShape>;
  pool.query = (async (...args: Parameters<typeof baseQuery>) => {
    const [first, ...rest] = args;
    if (typeof first === "object" && first !== null) {
      if ("types" in first) {
        delete (first as { types?: unknown }).types;
      }
      if ("rowMode" in first) {
        delete (first as { rowMode?: unknown }).rowMode;
      }
    }
    const result = await baseQuery(first, ...rest);

    if (Array.isArray(result.rows)) {
      const fields = result.fields ?? [];
      result.rows = result.rows.map((entry, index) => {
        if (Array.isArray(entry)) {
          return entry.reduce<Record<string, unknown>>((acc, value, valueIndex) => {
            const fieldName = toCamelCase(fields[valueIndex]?.name ?? String(valueIndex));
            acc[fieldName] = value;
            return acc;
          }, {});
        }

        if (entry && typeof entry === "object") {
          return Object.entries(entry as Record<string, unknown>).reduce<Record<string, unknown>>(
            (acc, [key, value]) => {
              acc[toCamelCase(key)] = value;
              return acc;
            },
            {},
          );
        }

        return entry;
      });
    }

    return result as unknown as Awaited<ReturnType<typeof pool.query>>;
  }) as typeof pool.query;

  const db = drizzle(pool, { schema });

  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "drizzle"),
  });

  const reset = async () => {
    await db.delete(schema.fettmattis).execute();
    await db.delete(schema.roundLoser).execute();
    await db.delete(schema.roundParticipants).execute();
    await db.delete(schema.rounds).execute();
    await db.delete(schema.players).execute();
    await db.delete(schema.users).execute();
  };

  const close = async () => {
    await pool.end();
  };

  return {
    db,
    pool,
    reset,
    close,
  };
}

function toCamelCase(value: string): string {
  return value.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());
}
