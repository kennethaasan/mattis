import { hashPassword } from "better-auth/crypto";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  BASIC_AUTH_PROVIDER_ID,
  basicAuthUser,
  basicAuthUserProfile,
} from "@/lib/auth/basic-auth-config";
import * as schema from "@/lib/db/schema";

export type SeedSchema = typeof schema;
export type SeedDb = NodePgDatabase<SeedSchema>;
export type TransactionClient = Parameters<
  Parameters<SeedDb["transaction"]>[0]
>[0];
export type DbExecutor = SeedDb | TransactionClient;

export async function ensureBasicAuthUser(client: DbExecutor): Promise<void> {
  const passwordHash = await hashPassword(basicAuthUser.password);

  await client
    .insert(schema.users)
    .values({
      id: basicAuthUser.id,
      ...basicAuthUserProfile,
    })
    .onConflictDoUpdate({
      target: schema.users.id,
      set: basicAuthUserProfile,
    });

  const accountRecord = {
    providerId: BASIC_AUTH_PROVIDER_ID,
    accountId: basicAuthUser.id,
    userId: basicAuthUser.id,
    password: passwordHash,
  } as const;

  await client
    .insert(schema.accounts)
    .values({
      id: basicAuthUser.id,
      ...accountRecord,
    })
    .onConflictDoUpdate({
      target: schema.accounts.id,
      set: accountRecord,
    });
}
