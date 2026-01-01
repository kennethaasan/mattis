import "dotenv/config";

import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/lib/db/schema";
import { generateId } from "@/lib/utils/id";

const INFO_PREFIX = "[admin:create]";
const ERROR_PREFIX = "[admin:create:error]";
const PROVIDER_ID = "credential";

const writeLine = (stream: NodeJS.WritableStream, message: string): void => {
  stream.write(`${message}\n`);
};

const writeInfo = (message: string): void => {
  writeLine(process.stdout, `${INFO_PREFIX} ${message}`);
};

const writeError = (message: string): void => {
  writeLine(process.stderr, `${ERROR_PREFIX} ${message}`);
};

const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.stack ?? `${error.name}: ${error.message}`;
  }

  return String(error);
};

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be set before creating the admin user.");
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME;

  if (!adminEmail) {
    throw new Error("ADMIN_EMAIL must be set before creating the admin user.");
  }

  if (!adminPassword) {
    throw new Error(
      "ADMIN_PASSWORD must be set before creating the admin user.",
    );
  }

  const resolvedAdminName = adminName ?? adminEmail;

  writeInfo(`Ensuring admin user ${adminEmail}...`);

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle({
    client: pool,
    schema,
    casing: "snake_case",
  });

  try {
    const passwordHash = await hashPassword(adminPassword);

    await db.transaction(async (tx) => {
      const existingUser = await tx.query.users.findFirst({
        where: eq(schema.users.email, adminEmail),
      });

      const userId = existingUser?.id ?? generateId();

      if (existingUser) {
        await tx
          .update(schema.users)
          .set({
            email: adminEmail,
            name: resolvedAdminName,
            emailVerified: true,
          })
          .where(eq(schema.users.id, userId));
      } else {
        await tx.insert(schema.users).values({
          id: userId,
          email: adminEmail,
          name: resolvedAdminName,
          emailVerified: true,
        });
      }

      const accountRecord = {
        id: userId,
        providerId: PROVIDER_ID,
        accountId: userId,
        userId,
        password: passwordHash,
      } as const;

      await tx
        .insert(schema.accounts)
        .values(accountRecord)
        .onConflictDoUpdate({
          target: schema.accounts.id,
          set: accountRecord,
        });
    });

    writeInfo(`Admin user ${adminEmail} is ready.`);
  } finally {
    await pool.end();
  }
}

void main().catch((error: unknown) => {
  writeError(formatError(error));
  process.exitCode = 1;
});
