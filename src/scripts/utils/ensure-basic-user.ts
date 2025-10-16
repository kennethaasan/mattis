import { hashPassword } from "better-auth/crypto";
import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { env } from "@/env";
import * as schema from "@/lib/db/schema";

export type SeedSchema = typeof schema;
export type SeedDb = NodePgDatabase<SeedSchema>;
export type TransactionClient = Parameters<Parameters<SeedDb["transaction"]>[0]>[0];
export type DbExecutor = SeedDb | TransactionClient;

const BASIC_PROVIDER_ID = "credential";

export async function ensureBasicAuthUser(client: DbExecutor): Promise<void> {
  const userId = env.BASIC_AUTH_USER_ID;
  const email = env.BASIC_AUTH_USERNAME.toLowerCase();
  const displayName = env.BASIC_AUTH_USERNAME;
  const passwordHash = await hashPassword(env.BASIC_AUTH_PASSWORD);

  await client
    .insert(schema.users)
    .values({
      id: userId,
      email,
      emailVerified: true,
      name: displayName,
      image: null,
      username: displayName,
    })
    .onConflictDoUpdate({
      target: schema.users.id,
      set: {
        email,
        emailVerified: true,
        name: displayName,
        image: null,
        username: displayName,
        updatedAt: sql<Date>`now()`,
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
      target: [schema.accounts.userId, schema.accounts.providerId],
      set: {
        password: passwordHash,
        updatedAt: sql<Date>`now()`,
      },
    });
}
