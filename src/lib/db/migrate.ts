import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

config({ path: ".env.local" });

const writeLine = (stream: NodeJS.WriteStream, message: string) => {
  stream.write(`${message}\n`);
};

const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.stack ?? `${error.name}: ${error.message}`;
  }

  return String(error);
};

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be set to run migrations.");
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql);

  writeLine(process.stdout, "Starting database migration...");
  await migrate(db, { migrationsFolder: "drizzle" });
  writeLine(process.stdout, "Migration complete!");
}

void (async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    writeLine(process.stderr, `Migration failed: ${formatError(error)}`);
    process.exit(1);
  }
})();
