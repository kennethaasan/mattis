import "dotenv/config";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    BASIC_AUTH_USERNAME: z.string(),
    BASIC_AUTH_PASSWORD: z.string(),
    BASIC_AUTH_USER_ID: z.uuid(),
    NODE_ENV: z.string().optional(),
  },
  experimental__runtimeEnv: {},
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});

const IS_DEVELOPMENT = !env.NODE_ENV || env.NODE_ENV === "development";
const IS_TEST = env.NODE_ENV === "test";

export const config = {
  IS_DEVELOPMENT,
  IS_TEST,
};
