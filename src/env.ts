import "dotenv/config";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    BASIC_AUTH_USERNAME: z.string(),
    BASIC_AUTH_PASSWORD: z.string(),
    BASIC_AUTH_USER_ID: z.uuid(),
    BETTER_AUTH_SECRET: z
      .string()
      .min(32, "BETTER_AUTH_SECRET must be at least 32 characters long.")
      .optional(),
    NODE_ENV: z.string().optional(),
  },
  experimental__runtimeEnv: {},
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});

const IS_DEVELOPMENT = !env.NODE_ENV || env.NODE_ENV === "development";
const IS_TEST = env.NODE_ENV === "test";

const DEFAULT_BETTER_AUTH_SECRET =
  "development-secret-development-secret-development";

const betterAuthSecret =
  env.BETTER_AUTH_SECRET ??
  (IS_DEVELOPMENT || IS_TEST ? DEFAULT_BETTER_AUTH_SECRET : undefined);

if (!betterAuthSecret) {
  throw new Error(
    "BETTER_AUTH_SECRET must be provided when NODE_ENV is production.",
  );
}

export const config = {
  IS_DEVELOPMENT,
  IS_TEST,
};

export const secrets = {
  BETTER_AUTH_SECRET: betterAuthSecret,
};
