import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";

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
      // React tests with jsdom
      {
        extends: true,
        test: {
          name: "react",
          environment: "jsdom",
          include: ["src/**/*.test.tsx", "tests/**/*.test.tsx"],
        },
      },
    ],
    setupFiles: ["./tests/setup.ts"],
    clearMocks: true,
    testTimeout: 30000,
    reporters: [
      "verbose",
      ["junit", { outputFile: "./reports/vitest.xunit.xml" }],
    ],
    coverage: {
      enabled: true,
      reportOnFailure: true,
      include: ["src/**/*.{ts,tsx}"],
      thresholds: {
        global: {
          statements: 20,
          functions: 70,
          branches: 70,
          lines: 20,
        },
      },
    },
  },
});
