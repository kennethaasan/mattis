/** @type {import('eslint').Linter.Config} */
const config = {
  root: true,
  extends: ["next/core-web-vitals"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: true,
  },
  plugins: ["@typescript-eslint", "import", "simple-import-sort"],
  rules: {
    // Next.js specific rules
    "@next/next/no-html-link-for-pages": "off",

    // TypeScript rules
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { prefer: "type-imports", fixStyle: "inline-type-imports" },
    ],
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/no-explicit-any": "error",

    // Import sorting
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
    "import/first": "error",
    "import/newline-after-import": "error",
    "import/no-duplicates": "error",

    // General rules
    "no-console": ["error", { allow: ["warn", "error"] }], // Allow warn/error, but not log/info
    "prefer-const": "error",
  },
  overrides: [
    // Configuration for test files
    {
      files: ["**/*.test.ts", "**/*.test.tsx"],
      rules: {
        "no-console": "off", // Allow console in tests
      },
    },
  ],
};

module.exports = config;
