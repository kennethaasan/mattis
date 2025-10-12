import { env } from "@/env";

export interface EnvBasicAuthUser {
  id: string;
  username: string;
  password: string;
}

export interface EnvBasicAuthUserUpserter {
  upsert: (user: EnvBasicAuthUser) => Promise<void>;
}

export function resolveEnvBasicAuthUser(): EnvBasicAuthUser {
  return {
    id: env.BASIC_AUTH_USER_ID,
    username: env.BASIC_AUTH_USERNAME,
    password: env.BASIC_AUTH_PASSWORD,
  };
}

export async function ensureEnvBasicAuthUser(
  upserter: EnvBasicAuthUserUpserter,
): Promise<EnvBasicAuthUser> {
  const user = resolveEnvBasicAuthUser();
  await upserter.upsert(user);
  return user;
}
