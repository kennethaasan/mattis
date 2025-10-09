import { vi } from "vitest";

// Set baseline environment variables for tests before modules import.
vi.stubEnv("DATABASE_URL", "postgresql://mattis:mattis@localhost:5432/mattis");
vi.stubEnv("DEV_USER_ID", "00000000-0000-4000-8000-000000000000");
vi.stubEnv(
  "NEXT_PUBLIC_DEFAULT_USER_ID",
  "00000000-0000-4000-8000-000000000000",
);
