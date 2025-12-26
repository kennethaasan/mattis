import "dotenv/config";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z
      .string()
      .min(32, "BETTER_AUTH_SECRET must be at least 32 characters long."),
    BETTER_AUTH_EMAIL_SENDER: z.string().email().optional(),
    BETTER_AUTH_TRUSTED_ORIGINS: z.string().optional(),
    BETTER_AUTH_URL: z.string().url().optional(),
    NODE_ENV: z.string().optional(),
    SES_ENABLED: z.coerce.boolean().optional().default(false),
    SES_REGION: z.string().optional(),
    SES_ACCESS_KEY_ID: z.string().optional(),
    SES_SECRET_ACCESS_KEY: z.string().optional(),
    SES_SOURCE_EMAIL: z.string().email().optional(),
    SES_CONFIGURATION_SET: z.string().optional(),
    POWERTOOLS_LOG_LEVEL: z
      .enum(["TRACE", "DEBUG", "INFO", "WARN", "ERROR", "CRITICAL"])
      .default("INFO"),
    POWERTOOLS_METRICS_NAMESPACE: z.string().min(1).default("mattis"),
    POWERTOOLS_TRACING_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
    POWERTOOLS_SERVICE_NAME: z.string().min(1).default("mattis"),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
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
    METRICS_NAMESPACE: env.POWERTOOLS_METRICS_NAMESPACE,
    TRACING_SAMPLE_RATE: env.POWERTOOLS_TRACING_SAMPLE_RATE,
    SERVICE_NAME: env.POWERTOOLS_SERVICE_NAME,
  },
};
