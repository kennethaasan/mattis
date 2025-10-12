AGENT QUICK REFERENCE

1. Node 22 (see .nvmrc). Install: npm install (root workspace). Copy .env.example -> .env.
2. Build: npm run build. Lint: npm run lint. Type check only: npm run tsc. Format write/check: npm run prettier:write / npm run prettier:check. These scripts are for all workspaces from root. pre-commit is available for local use; install hooks with `pre-commit install` after npm install so local checks mirror the CI stages.
3. Tests (Vitest multi-project): node + react/jsdom tests: npm test (watch: npm run test:watch). Single test file: npm run test path/to/file.unit.test.ts.
4. E2E: npm run test:e2e (UI: test:e2e:ui) with Next app. Author specs with native HTML semantics—use `getByRole`/`getByLabel` before CSS selectors, prefer accessible names derived from native markup or aria attributes, and treat explicit `aria-*` targeting or `[data-test-id]` usage as a last resort. To avoid flakes, await concrete UI states (no arbitrary timeouts), prefer `waitUntil: "domcontentloaded"` over `networkidle`, poll for rendered text when content streams in.
5. Seed/reset local infra: docker:compose:up / down / reset. Unified seeding: npm run seed (migrates DB + seeds DB). Avoid parallel with integration tests.
6. Coverage thresholds in vitest.config.ts (80%); npm test enables coverage. Reports under ./reports.
7. Lint rules (eslint.config.mjs): strict TS, no-console (error), no floating promises, enforce consistent type-only imports, Vitest rules, Next + React Query recommendations, sonarjs (recommended). Disable various @typescript-eslint* rules inside *.test.ts.
8. Style: 2-space indent (.editorconfig). Use type-only imports (import type { X }). noUncheckedIndexedAccess enabled; handle possibly undefined values.
9. Naming: files kebab-case; test files: _.test.ts / _.test.tsx in `__tests__` folders. Env vars UPPER_SNAKE_CASE. Constants UPPER_SNAKE_CASE. Avoid default exports; prefer named.
10. Errors: never swallow. Return typed Result or throw Error with actionable message. Log via pino; console.\* is forbidden (lint). Reject promises with Error instances only.
11. Imports: group builtin, external, internal (path aliases via tsconfig paths), then relative. No side-effect imports unless required (polyfills, env setup). Keep unused imports out (lint enforced).
12. Spectral: openapi lint (npm run spectral / spectral:ci) with project rules (.spectral.yaml overrides some rules off).
13. Secrets: never commit .env (ignored) except .env.example / .env.production. Use placeholder values.
14. Adding deps: maintain engines; after adding, run npm run lint && npm run tsc && npm test.
15. Database (drizzle): generate/migrate with db:generate, db:migrate. All seeding handled by npm run seed command.
16. Never modify generated or ignored paths (dist/, reports/, migrations/, .next/). Commit messages follow Conventional Commits (feat|fix|docs|refactor|test|chore|build|ci|perf|revert).
17. Use git mv when moving/renaming files to preserve git history
18. The canonical API contract lives at /openapi.yaml — keep it in sync when backend behaviour changes.
