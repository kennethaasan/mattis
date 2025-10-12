import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "tests/**/*.test.ts",
      "tests/**/*.test.tsx",
      "infra/**/*.test.ts",
    ],
    clearMocks: true,
    testTimeout: 30000,
    reporters: [
      "verbose",
      ["junit", { outputFile: "./reports/vitest.xunit.xml" }],
    ],
    coverage: {
      enabled: true,
      include: ["src/**/*.{ts,tsx}", "infra/**/*.ts"],
      thresholds: {
        global: {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
    },
  },
});
