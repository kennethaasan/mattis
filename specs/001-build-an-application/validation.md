# Phase 3.4: Acceptance Validation Status

Validation executed on 2025-10-07 using the manual harness `scripts/manual-validation.mjs` while the Next.js server and Postgres container were running locally. The flow was triggered via:

```
npx start-server-and-test "PORT=3000 npm run dev" http://localhost:3000 "node scripts/manual-validation.mjs"
```

The script exercises the API directly, following the acceptance criteria in `quickstart.md`, and performs additional SQL adjustments (via `pg`) to simulate the 24-hour edit window.

| Scenario | Status | Evidence |
|----------|--------|----------|
| Create Player | ✓ PASS | `POST /api/players` returned `201`, and subsequent `GET /api/players` showed the newly created records. |
| Record Round | ✓ PASS | `POST /api/rounds` (with two participants) succeeded and an immediate `PUT` within the 24h window returned `200`. |
| FettMattis Grant/Revoke | ✓ PASS | `POST /api/fettmattis` returned `201`, regular leaderboard reflected the award, and an immediate `DELETE` responded `204`. |
| View Regular Leaderboard | ✓ PASS | `GET /api/leaderboard/regular?year=2025` returned entries with correct participation/loss counts for both test players. |
| View FettMattis Leaderboard | ✓ PASS | `GET /api/leaderboard/fettmattis?year=2025` showed the active FettMattis counts. |
| 24h Edit/Delete Lock (Rounds) | ✓ PASS | After shifting `created_at` back 26 hours, `PUT /api/rounds/{id}` and `DELETE /api/rounds/{id}` both returned `403 Forbidden`. |
| 24h Revoke Lock (FettMattis) | ✓ PASS | After shifting `created_at` back 26 hours, `DELETE /api/fettmattis/{id}` returned `403 Forbidden`. |

All acceptance validations now pass; task **T040** is complete.
