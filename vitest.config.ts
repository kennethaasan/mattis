import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
      exclude: [
        "**/*.config.ts",
        "**/*.config.js",
        "**/*.d.ts",
        "drizzle/**",
        "infra/**",
        "src/lib/db/migrate.ts",
        "src/app/**/route.ts", // API routes are covered by contract/integration tests
        "src/app/layout.tsx",
        "src/app/page.tsx",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
