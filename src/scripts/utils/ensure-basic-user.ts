import { hashPassword } from "better-auth/crypto";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@/lib/db/schema";

export type SeedSchema = typeof schema;
export type SeedDb = NodePgDatabase<SeedSchema>;
export type TransactionClient = Parameters<
  Parameters<SeedDb["transaction"]>[0]
>[0];
export type DbExecutor = SeedDb | TransactionClient;

const BASIC_PROVIDER_ID = "credential";

export async function ensureBasicAuthUser(client: DbExecutor): Promise<void> {
  const userId = process.env.BASIC_AUTH_USER_ID as never;
  const email = process.env.BASIC_AUTH_USERNAME as never;
  const passwordHash = await hashPassword(
    process.env.BASIC_AUTH_PASSWORD as never
  );

  await client
    .insert(schema.users)
    .values({
      id: userId,
      email,
      emailVerified: true,
      name: email,
    })
    .onConflictDoUpdate({
      target: schema.users.id,
      set: {
        email,
        emailVerified: true,
        name: email,
      },
    });

  await client
    .insert(schema.accounts)
    .values({
      id: userId,
      providerId: BASIC_PROVIDER_ID,
      accountId: userId,
      userId,
      password: passwordHash,
    })
    .onConflictDoUpdate({
      target: schema.accounts.id,
      set: {
        providerId: BASIC_PROVIDER_ID,
        accountId: userId,
        userId,
        password: passwordHash,
      },
    });
}
