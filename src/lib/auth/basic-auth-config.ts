import { env } from "@/env";

export const BASIC_AUTH_PROVIDER_ID = "credential" as const;

export const basicAuthUser = {
  id: env.BASIC_AUTH_USER_ID,
  email: env.BASIC_AUTH_USERNAME,
  password: env.BASIC_AUTH_PASSWORD,
} as const;

export const basicAuthUserProfile = {
  email: basicAuthUser.email,
  emailVerified: true,
  name: basicAuthUser.email,
} as const;
