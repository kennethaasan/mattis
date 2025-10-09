import "dotenv/config";

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const DEFAULT_DEV_USER_ID = "00000000-0000-7000-8000-000000000000";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    DEV_USER_ID: z.uuid().default(DEFAULT_DEV_USER_ID),
  },
  client: {
    NEXT_PUBLIC_DEFAULT_USER_ID: z.uuid().default(DEFAULT_DEV_USER_ID),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DEV_USER_ID: process.env.DEV_USER_ID ?? DEFAULT_DEV_USER_ID,
    NEXT_PUBLIC_DEFAULT_USER_ID:
      process.env.NEXT_PUBLIC_DEFAULT_USER_ID ?? DEFAULT_DEV_USER_ID,
  },
  emptyStringAsUndefined: true,
});
