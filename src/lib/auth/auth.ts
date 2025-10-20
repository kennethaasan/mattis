import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { config, env } from "@/env";
import { db } from "@/lib/db/db";
import * as schema from "@/lib/db/schema";
import { getTrustedOrigins } from "./trusted-origins";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
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
    // Keep sessions active for as long as possible so users are not logged out.
    // 365 days aligns with the maximum duration recommended in the Better Auth docs.
    expiresIn: 60 * 60 * 24 * 365,
    updateAge: 60 * 60 * 24,
  },
});
