import { type Config } from "drizzle-kit";

const config: Config = {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  tablesFilter: ["mattis_*"],
};

export default config;
