<!--
Sync Impact Report
Version: 1.0.0 → 1.1.0 (MINOR)
Modified Principles: III (expanded Accessibility scope & explicit requirements)
Added Principles: V (Security & Supply Chain Assurance), VI (CI/CD Integrity & Reliability), VII (Observability & Metrics - advisory)
Updated Sections: Workflow & Quality Gates (added SAST, dependency + secret scan, action pinning, timeout enforcement, artifact/image signing SHOULD gate, accessibility enforcement)
Removed Sections: None
Templates To Update (same PR REQUIRED):
 - .specify/templates/plan-template.md (expand Constitution Check gates)
 - .specify/templates/spec-template.md (add Accessibility, Security/Supply Chain, Observability sections)
 - .specify/templates/tasks-template.md (mandatory tasks for SAST, dependency/secret scan, accessibility)
 - .specify/templates/agent-file-template.md (reference new principles)
 - AGENTS.md (document new principles & gate enforcement)
Deferred TODOs: Build provenance attestation (future major/minor), full tracing mandate (currently advisory), artifact signing escalation (currently SHOULD → future MUST)
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
- Performance-sensitive paths MUST include at least one timing/assertion test (see Principle IV & V budgets/security gating) when measurable via automated harness.
Rationale: Guarantees regressions surface early, ensures reliability of fast feedback loop, and preserves architectural intent through executable specifications.

### III. Consistent, Accessible & Inclusive User Experience
Rules:
- UI components MUST use native semantic HTML first; ARIA only to supplement when semantics unavailable.
- All interactive elements MUST have visible or programmatic accessible names reflecting visual labels (voice access friendliness).
- A "Skip to main" link (or equivalent bypass) MUST be present and focusable as first tab stop on each primary page shell.
- Keyboard navigation: no focus traps; roving tabindex or `aria-activedescendant` MUST be used for composite widgets (menus, lists, grids) with documented approach in PR if new pattern.
- Color contrast MUST satisfy WCAG 2.2 AA (≥4.5:1 normal text, ≥3:1 large text/UI indicators). Color MAY NOT be sole means of conveying state.
- Forms: required fields MUST use visual indicator + `aria-required`; validation errors MUST be descriptive and programmatically associated (`aria-describedby` + `aria-invalid`). First invalid field receives focus on failed submit.
- Headings MUST be hierarchical (no skipped levels) and only one `<h1>` per logical page view.
- E2E tests for new interactive flows MUST assert via role/label selectors (no CSS-only unless unavoidable) and include at least one accessibility assertion (e.g., presence of landmark/heading or ARIA snapshot) per major feature addition.
- Any custom keyboard interaction MUST be enumerated in the spec or plan and validated in tests.
- Locale & formatting: dates/numbers/text requiring localization MUST either use locale-aware APIs or document rationale for fixed formatting.
- Visual regression coverage SHOULD be added for modified shared components once visual testing infra lands (placeholder advisory until tooling integrated).
Rationale: Codifies inclusive design, reduces selector brittleness, improves automated test reliability, and lowers retrofitting cost.

### IV. Performance & Simplicity
Rules:
- Backend synchronous operations: target p95 < 200ms under nominal load (document deviation if exceeded during profiling).
- Frontend key interaction (user action → visible response) SHOULD complete < 100ms; initial meaningful content (LCP heuristic) target < 2.5s on reference hardware (modern mid‑range laptop, throttled normal network).
- Avoid premature optimization: measure first; any micro-optimization PR MUST include before/after metric.
- Added dependencies MUST justify: size, maintenance risk, existing capability gaps; remove if unused after two release cycles.
- Prefer clear code over cleverness; complexity (custom abstractions, meta-programming) MUST list concrete recurring pain it resolves.
- Feature scope MUST follow YAGNI: implement only spec-approved requirements; speculative hooks disallowed.
Rationale: Balances responsiveness with sustainable simplicity; prevents long-term drag from unjustified complexity or dependency sprawl.

### V. Security & Supply Chain Assurance
Rules:
- SAST (static analysis) MUST run in CI on every PR; any High or Critical severity finding blocks merge until fixed or explicitly waived with issue + expiry ≤14 days.
- Dependency & secret scanning MUST run each PR (GitHub dependency review / secret scan or equivalent). Discovered leaked secret = immediate PR closure + rotation task.
- Actions in GitHub workflows MUST be pinned to a major version tag or full commit SHA; usage of `@main`, `@master`, or `@latest` is prohibited.
- Third-party dependencies MUST list justification (gap filled + risk) in PR description if not previously used.
- Transitive vulnerability (High/Critical) MUST be mitigated (upgrade, patch, or suppression with documented CVE rationale + expiry ≤30 days).
- Artifact & container/image signing SHOULD be performed (pilot phase). Unsigned artifact MAY merge but SHOULD raise follow-up task; future minor release may elevate to MUST.
- Ephemeral cloud credentials via OIDC federation SHOULD replace static long‑lived keys; static credentials (if unavoidable) MUST have rotation plan documented.
- No secrets in code, logs, or artifact metadata; environment placeholders only.
- License policy: GPL/AGPL introduction requires maintainer review; incompatible license introduction blocks merge.
Rationale: Reduces attack surface, enforces trust in build chain, and ensures quick response to exploitable vulnerabilities.

### VI. CI/CD Integrity & Reliability
Rules:
- Every workflow job MUST specify `timeout-minutes`; default >45 minutes requires explicit rationale.
- Critical workflows (build, test, release) MUST define `permissions` block restricting `GITHUB_TOKEN` to least privilege (`contents: read` unless write needed).
- Deployment workflows MUST use concurrency groups to prevent overlapping production deployments.
- Build outputs (artifacts) MUST be immutable; deploy job MUST use previously built artifact (no re-build in deploy step).
- Unpinned or deprecated actions (detected by audit script) are merge blockers.
- Required gating sequence: (a) install+cache restore, (b) lint+type check, (c) unit+integration tests w/ coverage, (d) SAST + dependency/secret scan, (e) optional E2E smoke before main.
- Failed or skipped mandatory gate steps MUST fail the workflow (no silent continue-on-error for required gates).
- Reproducibility: artifact SHA (or checksum) MUST be surfaced in deployment logs; same SHA is deploy candidate for rollback.
- Advisory (future elevation): supply chain provenance attestation & SBOM generation SHOULD be explored; PRs piloting this tag tasks accordingly.
Rationale: Ensures pipeline trust, predictable deployments, and rapid detection of systemic weaknesses.

### VII. Observability & Metrics (Advisory, escalating over time)
Rules (ADVISORY unless noted):
- Structured logs SHOULD include: timestamp, level, correlation/request id, component, and omission of PII/secrets (MUST for secret omission).
- Request metrics (latency, error rate, throughput) SHOULD be captured for new services/features; alert thresholds documented in spec for critical endpoints.
- Tracing (distributed or intra-service) SHOULD wrap new cross-boundary calls; correlation id MUST propagate if already present.
- Dashboards SHOULD be created/updated when introducing new critical domain operations.
- Alerts MUST map to runbooks; no Critical/P0 alert without a linked remediation guide.
- Logging verbosity SHOULD default to info/debug separation; debug logs excluded from production unless diagnosing incident.
Rationale: Provides actionable insight and accelerates MTTR without imposing premature mandatory overhead.

## Implementation Standards & Constraints
- Tech Stack: Node 22, TypeScript strict mode, Vitest for unit/integration, Playwright for E2E, Drizzle for database.
- Dependency Management: After adding a dependency run: `npm run lint && npm run tsc && npm test`; failure blocks merge.
- Secrets: `.env` never committed; only `.env.example` / production template with placeholders.
- Versioning & Commits: Conventional Commits; breaking runtime change outside experimental areas MUST be a `feat!:` with migration notes.
- Database: All schema changes via migration command (`db:generate`, `db:migrate`); never hand-edit generated migration output post-commit.
- Logging & Observability: Use structured logging; sensitive values (secrets, tokens) MUST NOT be logged. Tracing currently advisory (Principle VII) until elevated.
- Error Handling: No silent catches; either rethrow or translate to domain error with context.
- Documentation: Feature spec + plan + tasks pipeline MUST be followed; missing stage docs block merge.

## Workflow & Quality Gates
- Feature Flow: spec → plan (Constitution Check) → design artifacts (contracts, data model, quickstart) → tasks → implementation → validation.
- Constitution Check: plan generation MUST translate principles into explicit gate bullets; any violation requires Complexity Tracking justification.
- CI Gates (minimum MUST pass):
  1. Install & cache restore
  2. Build + type check
  3. Lint
  4. Unit + integration tests (coverage ≥80% global, no file <70% without justification)
  5. SAST (no High/Critical open)
  6. Dependency vulnerability scan + secret scan (no unaddressed High/Critical; secret leak blocks)
  7. (Optional but RECOMMENDED) E2E smoke for changed critical paths
  8. Accessibility assertions present for new interactive features
  9. Action pinning & job timeout audit
  10. (SHOULD) Artifact/image signing verification
- Merge Blockers: any failing mandatory gate, decreased coverage below threshold, unresolved TODO markers, unexplained complexity, added unused dependency, unpinned disallowed action, missing job timeouts, High/Critical SAST or dependency vulnerability without approved waiver, secret exposure, absence of required accessibility test for new flow.
- Release Readiness: performance spot checks for new features; contract tests green; migrations reversible or rollback strategy documented; artifact checksum recorded; outstanding waivers resolved or tracked with unexpired issues.

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

**Version**: 1.1.0 | **Ratified**: 2025-10-05 | **Last Amended**: 2025-10-05
