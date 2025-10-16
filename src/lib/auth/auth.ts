import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { config, secrets } from "@/env";
import { db } from "@/lib/db/db";
import * as schema from "@/lib/db/schema";
import { getTrustedOrigins } from "./trusted-origins";

export const auth = betterAuth({
  secret: secrets.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: true,
  }),
  trustedOrigins: getTrustedOrigins,
  plugins: [nextCookies()],
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  session: {
    cookieCache: {
      enabled: !config.IS_TEST,
    },
  },
});
