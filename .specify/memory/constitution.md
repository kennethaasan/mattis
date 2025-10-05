<!--
Sync Impact Report
Version: (none) → 1.0.0
Modified Principles: (initial publication)
Added Sections: Core Principles (4), Implementation Standards & Constraints, Workflow & Quality Gates, Governance
Removed Sections: Placeholder Principle 5 (unused)
Templates Updated:
 - .specify/templates/plan-template.md ✅ (version reference)
 - .specify/templates/spec-template.md ✅ (no changes required)
 - .specify/templates/tasks-template.md ✅ (aligns with TDD + performance wording)
 - .specify/templates/agent-file-template.md ✅ (no changes needed; will reflect via future plan aggregation)
Deferred TODOs: None
-->

# Mattis Constitution

## Core Principles

### I. Code Quality Discipline
Rules:
- All code MUST pass `npm run lint` and `npm run tsc` (no warnings ignored) before merge.
- No `console.*` usage; structured logging only (pino) where runtime logging is required.
- Functions SHOULD remain under ~40 logical lines; if larger, justify in PR or refactor.
- Dead code, unused imports, and commented-out blocks MUST be removed in the same PR that makes them obsolete.
- Imports grouped: builtin, external, internal aliases, then relative (enforced by lint rules).
- Errors MUST be thrown/rejected as `Error` (or subclass) with actionable message; never swallow errors silently.
- Public APIs (exported symbols) MUST have concise doc comments when behavior is non-obvious.
Rationale: Enforces maintainability and predictability, directly leveraging existing lint + TypeScript strictness defined in AGENTS.md.

### II. Test Strategy & Coverage (Test-First)
Rules:
- TDD is REQUIRED: write/commit failing tests before implementing behavior (unit, contract, integration, or E2E).
- Minimum coverage threshold: 80% lines & branches globally (already enforced); new code SHOULD not reduce any file below 70% without explicit justification.
- Every new endpoint or externally consumed contract MUST have a contract test before implementation.
- Integration tests MUST cover critical user journeys enumerated in feature specs; E2E tests validate accessibility roles & flows via semantic selectors (`getByRole`, `getByLabel`).
- Test doubles limited to: external systems, nondeterministic time/random sources, and network boundaries. Avoid mocking internal pure logic.
- Flaky tests (detected ≥2 intermittent failures) MUST be quarantined (skipped with issue reference) or fixed within 2 working days; no merges that increase flake count.
- Performance-sensitive paths MUST include at least one timing/assertion test (see Principle IV budgets) when measurable via automated harness.
Rationale: Guarantees regressions surface early, ensures reliability of fast feedback loop, and preserves architectural intent through executable specifications.

### III. Consistent & Accessible User Experience
Rules:
- UI components MUST use native semantic HTML first; ARIA only to supplement when semantics unavailable.
- Queries in E2E tests MUST prefer accessible roles / labels; `[data-test-id]` is a last resort and requires justification.
- All interactive elements MUST have visible or programmatic (aria-label/title) accessible names.
- No visual regressions introduced without updated screenshots or story references (when visual testing infra is added; placeholder policy).
- Text content and date/number formatting MUST be locale aware or explicitly documented if fixed.
- Error states MUST provide actionable user guidance (not generic "Error occurred").
Rationale: Ensures inclusive, testable, and stable UX surfaces and reduces brittle selector maintenance.

### IV. Performance & Simplicity
Rules:
- Backend synchronous operations: target p95 < 200ms under nominal load (document deviation if exceeded during profiling).
- Frontend key interaction (user action → visible response) SHOULD complete < 100ms; initial meaningful content (LCP heuristic) target < 2.5s on reference hardware (modern mid‑range laptop, throttled normal network).
- Avoid premature optimization: measure first; any micro-optimization PR MUST include before/after metric.
- Added dependencies MUST justify: size, maintenance risk, existing capability gaps; remove if unused after two release cycles.
- Prefer clear code over cleverness; complexity (custom abstractions, meta-programming) MUST list concrete recurring pain it resolves.
- Feature scope MUST follow YAGNI: implement only spec-approved requirements; speculative hooks disallowed.
Rationale: Balances responsiveness with sustainable simplicity; prevents long-term drag from unjustified complexity or dependency sprawl.

## Implementation Standards & Constraints
- Tech Stack: Node 22, TypeScript strict mode, Vitest for unit/integration, Playwright for E2E, Drizzle for database.
- Dependency Management: After adding a dependency run: `npm run lint && npm run tsc && npm test`; failure blocks merge.
- Secrets: `.env` never committed; only `.env.example` / production template with placeholders.
- Versioning & Commits: Conventional Commits; breaking runtime change outside experimental areas MUST be a `feat!:` with migration notes.
- Database: All schema changes via migration command (`db:generate`, `db:migrate`); never hand-edit generated migration output post-commit.
- Logging & Observability: Use structured logging; sensitive values (secrets, tokens) MUST NOT be logged. (Future addition: central tracing—amend constitution when adopted.)
- Error Handling: No silent catches; either rethrow or translate to domain error with context.
- Documentation: Feature spec + plan + tasks pipeline MUST be followed; missing stage docs block merge.

## Workflow & Quality Gates
- Feature Flow: spec → plan (Constitution Check) → design artifacts (contracts, data model, quickstart) → tasks → implementation → validation.
- Constitution Check: plan generation MUST translate principles into explicit gate bullets; any violation requires Complexity Tracking justification.
- CI Gates (minimum): install, build, type check, lint, unit + integration tests with coverage, (optional) E2E smoke before merge to main.
- Merge Blockers: failing CI, decreased coverage below threshold, unresolved TODO markers, unexplained complexity, added unused dependency.
- Release Readiness: performance spot checks for new features; contract tests green; migrations reversible or rollback strategy documented.

## Governance
- Authority: This constitution supersedes ad-hoc preferences. Conflicts resolved in favor of the stricter rule or explicit constitutional language.
- Amendment Procedure:
  1. Open PR with: (a) redline diff, (b) Sync Impact Report updates, (c) version bump rationale (patch/minor/major).
  2. Obtain approval from at least one maintainer (or consensus if >2 maintainers actively contributing).
  3. Update dependent templates (plan/spec/tasks/agent guidelines) within same PR.
- Versioning Policy:
  - MAJOR: Remove or fundamentally redefine a principle / governance process.
  - MINOR: Add new principle, new mandatory gate, or materially expand enforceable scope.
  - PATCH: Clarifications, editorial fixes, non-normative wording adjustments.
- Compliance Reviews: Run at least quarterly or before a significant release; sample recent merges for adherence. Non-compliance results in remediation tasks prioritized next sprint.
- Exception Handling: Temporary deviations (e.g., lowering coverage for spike) MUST include an issue reference with expiration date; remove or fulfill within 2 weeks.
- Enforcement: Reviewers and automated scripts act as first line; repeated violations escalate to mandatory refactor tasks before new feature work.

**Version**: 1.0.0 | **Ratified**: 2025-10-05 | **Last Amended**: 2025-10-05
