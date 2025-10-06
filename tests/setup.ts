import { vi } from "vitest";

// Set the DATABASE_URL for integration tests.
vi.stubEnv("DATABASE_URL", "postgresql://mattis:mattis@localhost:5432/mattis");
