import "dotenv/config";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z
      .string()
      .min(32, "BETTER_AUTH_SECRET must be at least 32 characters long."),
    NODE_ENV: z.string().optional(),
    POWERTOOLS_LOG_LEVEL: z
      .enum(["TRACE", "DEBUG", "INFO", "WARN", "ERROR", "CRITICAL"])
      .default("INFO"),
    POWERTOOLS_TRACING_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
    POWERTOOLS_SERVICE_NAME: z.string().min(1).default("mattis"),
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
  POWERTOOLS: {
    LOG_LEVEL: env.POWERTOOLS_LOG_LEVEL,
    TRACING_SAMPLE_RATE: env.POWERTOOLS_TRACING_SAMPLE_RATE,
    SERVICE_NAME: env.POWERTOOLS_SERVICE_NAME,
  },
};
