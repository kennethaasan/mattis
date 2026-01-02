# Tasks: Rewrite Legacy Laravel Mattis Stats App

**Input**: Design documents from `/specs/001-build-an-application/`

## Phase 3.1: Setup & Infrastructure

- [x] **T001**: Initialize a new Next.js application with the App Router and TypeScript.
- [x] **T002**: Install primary dependencies: `tailwindcss`, `drizzle-orm`, `pg`, `lucide-react`, `@t3-oss/env-nextjs`.
- [x] **T003**: Configure Tailwind CSS and initialize Shadcn UI.
- [x] **T004**: Set up ESLint and Prettier for code quality, enforcing rules from the constitution.
- [x] **T005**: [P] Initialize AWS CDK stack in the `infra/` directory for AWS Lambda and Aurora Serverless.
- [x] **T006**: [P] Configure `drizzle-kit` for database migrations and define the local development database connection.
- [x] **T007**: Create a GitHub Actions workflow for CI (`.github/workflows/ci.yml`) that runs linting, type-checking, and tests on every push.

## Phase 3.2: Backend Development (TDD)

### Tests First ⚠️

- [x] **T008**: [P] Write a failing contract test for `POST /api/players` to validate the request/response schema.
- [x] **T009**: [P] Write a failing contract test for `GET /api/players`.
- [x] **T010**: [P] Write a failing contract test for `POST /api/rounds`.
- [x] **T011**: [P] Write a failing contract test for `PUT /api/rounds/{roundId}`.
- [x] **T012**: [P] Write a failing contract test for `DELETE /api/rounds/{roundId}`.
- [x] **T013**: [P] Write a failing contract test for `POST /api/fettmattis`.
- [x] **T014**: [P] Write a failing contract test for `DELETE /api/fettmattis/{fettmattisId}`.
- [x] **T015**: [P] Write a failing integration test to cover the user story of creating a player and seeing them in the player list.
- [x] **T016**: [P] Write a failing integration test for recording a round and verifying the leaderboard updates.

### Core Implementation

- [x] **T017**: [P] Define the Drizzle ORM schema in `src/lib/db/schema.ts` for all tables: `users`, `players`, `rounds`, `round_participants`, `round_loser`, and `fettmattis`.
- [x] **T018**: Generate the initial database migration using `drizzle-kit`.
- [x] **T019**: Implement the `POST /api/players` and `GET /api/players` API routes in `src/app/api/players/route.ts`.
- [x] **T020**: Implement the `GET /api/players/{playerId}` and `PUT /api/players/{playerId}` API routes.
- [x] **T021**: Implement the `POST /api/rounds` API route in `src/app/api/rounds/route.ts`.
- [x] **T022**: Implement the `GET /api/rounds/{roundId}`, `PUT /api/rounds/{roundId}`, and `DELETE /api/rounds/{roundId}` API routes.
- [x] **T023**: Implement the `POST /api/fettmattis` and `DELETE /api/fettmattis/{fettmattisId}` API routes.
- [x] **T024**: Implement the service logic for calculating leaderboard statistics.
- [x] **T025**: Implement the `GET /api/leaderboard/regular` and `GET /api/leaderboard/fettmattis` API routes.
- [x] **T026**: Add input validation using Zod for all API routes.

## Phase 3.3: Frontend Development

- [x] **T027**: [P] Create a reusable `PlayerForm` component for creating and editing players.
- [x] **T028**: [P] Create a `RoundForm` component for recording and editing rounds.
- [x] **T029**: [P] Create a `FettmattisForm` component for creating Fettmattis records.
- [x] **T030**: [P] Develop the main `Leaderboard` component to display both regular and Fettmattis leaderboards.
- [x] **T031**: Implement the player management page.
- [x] **T032**: Implement the round creation/editing page.
- [x] **T033**: Implement the main leaderboard page.
- [x] **T034**: Implement global state management for user authentication (e.g., using React Context).
- [x] **T035**: Ensure all UI components meet the accessibility standards defined in the spec (WCAG 2.2 AA).

## Phase 3.4: Polish & Deployment

- [x] **T036**: [P] Write unit tests for all critical service logic and utility functions.
- [x] **T037**: [P] Write E2E tests with Playwright for the main user flows (creating a player, recording a round, viewing leaderboards).
- [x] **T038**: Configure the AWS CDK stack in `infra/lib/mattis-stack.ts` to deploy the Next.js app to AWS Lambda.
- [x] **T039**: Create a GitHub Actions workflow for deployment (`.github/workflows/deploy.yml`) that deploys the CDK stack.
- [x] **T040**: Manually validate all acceptance criteria from the `quickstart.md`.

## Dependencies

- **T008-T016** (Tests) must be completed before **T017-T026** (Core Implementation).
- **T017** (Schema) blocks **T018** (Migration) and **T019-T026** (API Routes).
- **T019-T026** (API Routes) block **T027-T033** (Frontend Components/Pages).
