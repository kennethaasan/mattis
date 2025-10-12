import "dotenv/config";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const getOptionalEnvVar = (key: string): string | undefined => {
  return process.env[key];
};

const IS_DEVELOPMENT =
  !getOptionalEnvVar("NODE_ENV") ||
  getOptionalEnvVar("NODE_ENV") === "development";
const IS_TEST = getOptionalEnvVar("NODE_ENV") === "test";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    BASIC_AUTH_USERNAME: z.string().min(1),
    BASIC_AUTH_PASSWORD: z.string().min(1),
    BASIC_AUTH_USER_ID: z.uuid().min(1),
    IS_DEVELOPMENT: z.boolean(),
    IS_TEST: z.boolean(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BASIC_AUTH_USERNAME: process.env.BASIC_AUTH_USERNAME,
    BASIC_AUTH_PASSWORD: process.env.BASIC_AUTH_PASSWORD,
    BASIC_AUTH_USER_ID: process.env.BASIC_AUTH_USER_ID,
    IS_DEVELOPMENT,
    IS_TEST,
  },
  emptyStringAsUndefined: true,
});
