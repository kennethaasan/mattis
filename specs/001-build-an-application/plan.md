# Implementation Plan: Rewrite Legacy Laravel Mattis Stats App

**Branch**: `001-build-an-application` | **Date**: 2025-10-06 | **Spec**: [./spec.md](./spec.md)
**Input**: Feature specification from `/Users/k.aasan/projects/aasan/mattis/specs/001-build-an-application/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
6. Execute Phase 1 → contracts, data-model.md, quickstart.md
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

## Summary
This plan outlines the rewrite of the legacy Laravel-based "Mattis" stats application into a modern, serverless TypeScript application. The new system will track player participation, losses, and special "FettMattis records" using a dual-leaderboard model. The technical approach involves a Next.js frontend, a serverless backend using AWS Lambda and Aurora, and Infrastructure as Code managed by the AWS CDK.

## Technical Context
**Language/Version**: TypeScript 5.x (ES2022 target), Node.js 22
**Primary Dependencies**: Next.js, React, Tailwind CSS, Shadcn UI, Drizzle ORM, AWS CDK
**Storage**: AWS Aurora Serverless (PostgreSQL compatible)
**Testing**: Vitest (Unit/Integration), Playwright (E2E)
**Target Platform**: AWS Serverless (Lambda)
**Project Type**: Web Application (Full-stack Next.js)
**Performance Goals**: p95 latency < 200ms for API responses (leaderboard/player details).
**Constraints**: All time-based logic (e.g., 24h edit window, yearly reset) must be strictly based on UTC.
**Scale/Scope**: Low initial scale (≤ 1,500 rounds/year).

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The following gates from Constitution v1.1.0 are satisfied:

**Mandatory (MUST) Gates**
1.  **Architectural Simplicity**: The architecture is a standard full-stack Next.js application, avoiding unnecessary layers.
2.  **Security & Supply Chain**:
    *   SAST will be integrated into the CI/CD pipeline.
    *   Dependency scanning will be part of the CI/CD pipeline.
    *   Secrets will be managed via environment variables, not committed to code.
    *   CI actions will be pinned to major versions or commit SHAs.
3.  **CI Integrity & Controls**:
    *   `GITHUB_TOKEN` permissions will be restricted in workflows.
    *   Deployment workflows will use concurrency groups.
    *   Workflows will have defined timeouts.
4.  **Accessibility & Inclusion**:
    *   UI surfaces (leaderboards, forms) are identified.
    *   Requirements adhere to WCAG 2.2 AA, covering forms, semantic HTML, and keyboard navigation as per the spec.
5.  **Observability Baseline**:
    *   Key events (e.g., `RoundCreate`, `FettMattisCreate`) and metrics are defined in the spec.
6.  **Testing Gates Defined**:
    *   The plan includes contract tests (OpenAPI), integration tests (user scenarios), and E2E tests (accessibility).
7.  **Data / Privacy / Retention**: The spec defines indefinite retention for audit purposes and soft-delete behavior.
8.  **Performance & Scale**: High-level targets are defined based on expected low scale.

**Advisory (SHOULD) Gates**
*   All advisory gates are considered but deferred for the initial implementation unless they become necessary.

**Violation Handling**: No violations identified.

## Project Structure

### Documentation (this feature)
```
specs/001-build-an-application/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── openapi.yaml
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Web application structure
infra/                  # AWS CDK Infrastructure
  └── lib/
      └── mattis-stack.ts
src/
  ├── app/              # Next.js App Router
  │   ├── api/          # API Routes (Backend)
  │   │   ├── players/
  │   │   └── rounds/
  │   ├── (components)/ # UI Components
  │   └── (pages)/      # Page routes
  ├── lib/              # Shared logic
  │   ├── db/           # Drizzle schema and client
  │   └── utils/
  └── styles/
tests/
  ├── contract/         # OpenAPI contract tests
  ├── integration/      # Vitest integration tests
  └── e2e/              # Playwright E2E tests
```

**Structure Decision**: A monorepo structure containing the Next.js application (`src/`) and the AWS CDK infrastructure (`infra/`). This keeps the application and its infrastructure definition co-located.

## Phase 0: Outline & Research
**Output**: [research.md](./research.md) with all technical decisions resolved.

## Phase 1: Design & Contracts
**Output**:
- [data-model.md](./data-model.md) defining the database schema.
- [contracts/openapi.yaml](./contracts/openapi.yaml) for the API specification.
- [quickstart.md](./quickstart.md) for local setup and validation.

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do.*

**Task Generation Strategy**:
- Generate tasks from the OpenAPI specification and the data model.
- **Backend**:
    - For each database entity: Create Drizzle schema and migration tasks.
    - For each API endpoint: Create Next.js API route handler and corresponding service logic tasks.
- **Frontend**:
    - Create tasks for UI components (leaderboards, forms).
- **Testing**:
    - Create TDD-style tasks: write a failing test (contract, integration, or E2E) before implementing the feature.
- **Infrastructure**:
    - Create tasks for defining the AWS CDK stack (Lambda, Aurora, IAM roles).

**Ordering Strategy**:
1.  **Infra**: Define the core infrastructure.
2.  **Backend**: Models -> API Routes -> Services.
3.  **Frontend**: Components -> Pages.
4.  **Testing**: Tests will be created alongside the features they cover.

**Estimated Output**: 30-40 numbered, ordered tasks in `tasks.md`.

## Complexity Tracking
No complexity deviations from the constitution are required for this plan.

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented
