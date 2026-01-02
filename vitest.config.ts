import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
        },
      },
      // React tests with happy-dom
      {
        extends: true,
        test: {
          name: "react",
          environment: "happy-dom",
          include: ["src/**/*.test.tsx", "tests/**/*.test.tsx"],
        },
      },
    ],
    setupFiles: ["./tests/setup.ts"],
    clearMocks: true,
    testTimeout: 30000,
    reporters: ["verbose"],
    coverage: {
      enabled: true,
      reportOnFailure: true,
      reporter: ["text", "text-summary", "json-summary", "json"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/scripts/**"],
      thresholds: {
        global: {
          statements: 50,
          functions: 85,
          branches: 75,
          lines: 50,
        },
      },
    },
  },
});
