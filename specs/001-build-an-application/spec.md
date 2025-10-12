# Feature Specification: Rewrite Legacy Laravel Mattis Stats App to Modern TypeScript Application (Loss Model + FettMattis Model)

**Feature Branch**: `001-build-an-application`  
**Created**: 2025-10-05  
**Last Updated**: 2025-10-05  
**Status**: Draft – 14 resolved / 0 open clarifications (All listed clarifications resolved on 2025-10-05)

**Input (original brief)**: "Rewrite the app in the `laravel` folder to TypeScript. The app tracks statistics for the card game 'Mattis'. Use legacy behavior & UI as reference."  
**Current Direction Update**: Scoring/winner model removed. System now tracks: participation, a single loser per round, yearly loss percentage, and independent FettMattiss (manually fettmattised, optional round link). Two leaderboards: (1) Regular (lowest loss %), (2) Fettmattis (most fettmattiss). Year resets January 1st (UTC). 24h edit/soft‑delete window for rounds and fettmattiss.

---

## ⚡ Specification Guardrails

- Focus on WHAT & WHY (stakeholder language).
- No implementation technology details.
- All requirements testable.
- No hidden assumptions: ambiguities resolved or explicitly documented.
- Removed legacy score/win average concepts—superseded by loss model + fettmattis model.

---

## Clarifications

### Session 2025-10-05

- Q: Should we separate auth `User` from `Player` for created_by/audit? → A: B: Separate `User` (auth) and `Player` (profile); `created_by` references `user.id`.

---

## User Scenarios & Testing _(mandatory)_

### Primary User Story

As participants of the Mattis community, we want to record each round (who played, who lost) and optionally fettmattis special Fettmattis recognitions so we can compare fairness (avoidance of losses) and celebrate notable moments.

### Acceptance Scenarios

1. **Create Player**: Given a need to add a new participant, when a user supplies a unique display name, then the player appears in all selection lists and future statistics.
2. **Record Round**: Given at least 2 participating players, when a round is saved with participants and one marked loser, then yearly stats and leaderboards reflect the change immediately.
3. **FettMattis Fettmattis**: Given at least 1 existing player (and optionally a recently recorded round), when a user creates a FettMattis specifying a player (and optionally linking a round), then the Fettmattis leaderboard updates fettmattis counts immediately.
4. **Revoke FettMattis (within 24h)**: Given an fettmattis is less than 24 hours old, when a user revokes it, then the fettmattis no longer contributes to any fettmattis metrics and an audit trail persists the change.
5. **View Regular Leaderboard**: Given rounds exist this calendar year (UTC), when the leaderboard is viewed, then players with at least 1 participation this year are ranked by (a) loss percentage ascending (losses / total rounds in the calendar year), (b) participation count descending, (c) player name ascending.
6. **View Fettmattis Leaderboard**: Given at least one non-revoked FettMattis exists this year, when the Fettmattis leaderboard is opened, then players are ranked by total fettmattiss descending, tie‑break by player name ascending.
7. **Year Reset**: Given a new calendar year has begun (UTC), when the first new round or fettmattis is recorded, then all per‑year statistics (loss percentage, participations, fettmattis counts) restart from zero without altering historical prior year data.
8. **Edit Round (within 24h)**: Given a round was created less than 24 hours ago (UTC comparison), when an authorized user edits participants or changes the loser, then statistics recompute accordingly.
9. **Soft Delete Round (within 24h)**: Given a round is under 24 hours old, when it is deleted, then it no longer contributes to any metrics and an audit trail is preserved (conceptual—stakeholders may review removed counts if governance needed).
10. **Edit Attempt After Window**: Given a round is older than 24 hours, when a user attempts to edit or delete it, then the system blocks the action and explains the lock policy.
11. **Revoke Attempt After Window**: Given a FettMattis is older than 24 hours, when a user attempts to revoke it, then the system blocks the action and explains the lock policy.
12. **Inactive Player Visibility**: Given a player was marked inactive but has participated in at least one round this year, when leaderboards are viewed, then the player remains visible (inactive does not hide current‑year participants).
13. **Validation Failure (Round)**: Given a round submission missing a loser or with fewer than required participants, when submitted, then the system rejects it and associates accessible error messages to relevant inputs.
14. **Validation Failure (FettMattis)**: Given an fettmattis submission missing a player or duplicating an existing (player + same round link) combination, when submitted, then the system rejects it with accessible error messages.
15. **Player Rename**: Given a player is renamed, when any leaderboard or detail page is viewed, then historical data remains intact while the new display name appears.
16. **Empty State**: Given no rounds (or fettmattiss) exist this year, when leaderboards are viewed, then clear empty state messaging appears (no players ranked yet).
17. **Time Zone Consistency**: Given a round or fettmattis near year boundary (e.g., Dec 31 23:59:30 UTC), when recorded, then it is counted in the correct year determined strictly by UTC.

### Edge Cases

- Round with duplicate player entries → reject (no duplicates per round).
- Multiple losers attempt → reject (single loser enforced).
- Duplicate FettMattis for same player + same round link → reject.
- FettMattis referencing a soft-deleted round → reject (round linkage must target active round) OR allow omission of round link (user must re‑fettmattis without linkage) (ABUSE-CLAR-01 may refine; currently reject).
- Attempt to create an FettMattis then revoke after window (>24h) → block with message.
- Rapid sequential fettmattiss for same player (potential abuse) → allowed for now (monitor; ABUSE-CLAR-01 placeholder).
- Player deactivated mid‑year → remains in rankings if participated this year; cannot receive new fettmattiss if policy later restricts (FR-CLAR-03 may extend this).
- Rapid sequential round submissions near year boundary → ensure correct year attribution.

---

## Requirements _(mandatory)_

### Functional Requirements

(Existing numbering retained; new items appended.)

- **FR-001**: System MUST allow creation of Players with a unique (case-insensitive) display name.
- **FR-002**: System MUST store an active/inactive flag for Players; inactive players CANNOT be selected for new rounds (policy) but REMAIN in leaderboards if they participated this year.
- **FR-003**: System MUST allow recording a Round with: (a) list of participating players (>= 2) (b) exactly one loser.
- **FR-004**: System MUST allow editing a Round’s participants and loser ONLY within 24h of creation (UTC) then lock further edits.
- **FR-005**: System MUST soft delete a Round within 24h of creation and disallow deletion afterward; soft deleted rounds MUST be excluded from all statistics.
- **FR-006**: System MUST compute yearly (UTC) statistics for each player: total participations, total losses, loss percentage = losses / total rounds in the calendar year (denominator = total rounds in year; intentional fairness model).
- **FR-007 (Revised)**: System MUST compute yearly FettMattis count per player (non-revoked fettmattiss), and total global fettmattis count.
- **FR-008**: System MUST present the Regular Leaderboard with ranking & tie-break logic: primary loss % ascending, secondary participation count descending, tertiary player name ascending.
- **FR-009 (Revised)**: System MUST present the Fettmattis Leaderboard ranking players by total non-revoked FettMattiss descending, tie-break player name ascending.
- **FR-010**: System MUST reset yearly statistics automatically on January 1st 00:00:00 UTC without modifying persisted historical records.
- **FR-011**: System MUST ensure player rename propagates to all displays without altering historical participation/loss/fettmattis data.
- **FR-012**: System MUST expose a player detail view including: yearly metrics, historical trend (optional if clarified), total fettmattiss, and loss percentage trend if stored.
- **FR-013**: System MUST show empty state messaging for each leaderboard or detail view lacking qualifying data.
- **FR-014 (Revised)**: System MUST validate Round creation/edit: (a) no duplicate players (b) exactly one loser (c) loser among participants (d) minimum participant count = 2.
- **FR-015**: System MUST reject round edits/soft deletions after the 24h window with a user-friendly explanation.
- **FR-016**: System MUST prevent participation assignment to inactive players in new rounds while preserving their historical stats.
- **FR-017**: System MUST provide accessible, programmatically associated validation messages for failed player creation or round/fettmattis submission.
- **FR-018**: System MUST maintain an audit trail for soft-deleted rounds (timestamp, actor, original data snapshot) for governance.
- **FR-019**: System SHOULD allow filtering leaderboards by year (historical year selection) if legacy usage or stakeholder value justifies it (pending confirmation FR-CLAR-04).
- **FR-020**: System SHOULD allow exporting current year leaderboards (format TBD—FR-CLAR-05).
- **FR-021**: System MUST base all time calculations and window enforcement on UTC (no local offset reliance).
- **FR-022**: System SHOULD provide an overview page summarizing: players (active/total), total rounds this year, total fettmattiss this year, average participants per round.
- **FR-023**: System SHOULD surface a warning if inactivity (0 participations) results in top loss % placement (potential fairness communication) (pending stakeholder approval FR-CLAR-06).
- **FR-024 (New)**: System MUST allow creating a FettMattis with: (a) target player (b) optional round reference (nullable) (c) created timestamp (d) created_by actor.
- **FR-025 (New)**: System MUST allow revoking (soft deleting) a FettMattis within 24h of creation; after 24h fettmattis becomes immutable.
- **FR-026 (New)**: System MUST enforce uniqueness: no more than one active (non-revoked) FettMattis for the same (player, round) pair (if round link supplied); multiple fettmattiss without round linkage allowed unless limited by ABUSE-CLAR-01 future rule.
- **FR-027 (New)**: System MUST maintain an audit trail for fettmattis creation and revocation (timestamps, actor, prior state, optional rationale if later added).

### Clarification Placeholders (Unresolved — require stakeholder input)

_See Resolved Clarifications section for FR-CLAR-01 & FR-CLAR-02 decisions._

- **ABUSE-CLAR-01**: Should there be daily/weekly caps or rate limits on fettmattiss per player or globally?
- **FR-CLAR-03**: Policy on reactivating inactive players & whether historical inactivity influences rankings display toggle.
- **FR-CLAR-04**: Need for historical year browsing of leaderboards.
- **FR-CLAR-05**: Desired export formats (CSV, PDF, Print-friendly).
- **FR-CLAR-06**: Whether to implement fairness notice for 0-participation low loss % placements.
- **SEC-CLAR-01**: Future authentication model / roles?
- **SEC-CLAR-02**: Require rate limit / captcha for round creation?
- **PERF-CLAR-01**: Expected max rounds/year to calibrate perf budgets.
- **RET-CLAR-01**: Any retention limit or audit purge?
- **MIG-CLAR-01**: How derive loser from legacy score data? Rule?
- **CORR-CLAR-01**: Introduce “correction” note pattern for post-lock adjustments?
- **DISCUSS-CLAR-02**: Need user-facing distinction between deleted vs never-existent round/fettmattis?

> All CLAR items block removal of “Draft” status once core implementation planning begins unless formally deferred.

### Key Entities

- **Player**: display name (unique), active flag, created date. Relationships: Participates in many Rounds; may receive many FettMattiss.
- **Round**: created timestamp (UTC), participants (Players), single loser (Player), deleted*at (nullable for soft delete). \_No fettround flag stored.*
- **FettmattisFettMattis**: id, player_id (required), round_id (optional, nullable), created_at (UTC), revoked_at (nullable), created_by actor id. Represents a discrete recognition; counts only if not revoked.
- **Yearly Statistics (Derived, not persisted unless cached)**: For each calendar year (UTC): participations, losses, loss %, fettmattis count.
- **User (Actor)**: Person performing actions. Decision: `User` (auth) is separate from `Player` (profile); `created_by` and audit fields reference `user.id`. Players may optionally link to a `user_id` for auth/profile pairing.

---

## Non-Functional Requirements

### Accessibility & Inclusion (Mandatory)

- All form controls (player creation, round entry, fettmattis creation) MUST have explicit labels and accessible error messages linked via programmatic association.
- Leaderboards MUST use semantic tables with appropriate `<th>` headers for column identification (sortable columns indicated accessibly if sorting UI exists).
- Focus order MUST follow visual order; skip link to main content present.
- Color alone MUST NOT indicate loser or fettmattis status; include icon/text marker.
- Deleted (soft) rounds or revoked fettmattiss are not visible in standard UI; if an audit view is introduced, it MUST convey status accessibly (e.g., “Removed (not counted)”).

### Security & Supply Chain

- Authentication (Phase 1 – interim): Basic Auth retained temporarily (known risks: replay, weak secrecy). Stronger auth/roles & session hardening TBD (SEC-CLAR-01).
- Soft deletion prevents silent data loss; audit log integrity (append-only + tamper detection) TBD post auth decision.
- No secrets beyond data store credentials expected; no PII beyond display names.
- Abuse scenarios: mass creation of rounds or fettmattiss to distort denominators (rate limiting / possible captcha policy TBD SEC-CLAR-02 & ABUSE-CLAR-01).
- Note: FR-CLAR-01 & FR-CLAR-02 resolved; SEC & ABUSE items remain open.

### Observability

- Events: PlayerCreated, PlayerDeactivated, RoundRecorded, RoundEdited, RoundSoftDeleted, FettMattisCreated, FettMattisRevoked, YearStatsViewed, LeaderboardViewed.
- Counters/Gauges: totalPlayers, activePlayers, roundsYearToDate, fettmattissYearToDate, avgParticipantsPerRoundYTD.
- Derived Metrics (Leaderboards): lossPercentage, participationRank, fettmattisRank.
- Error Events: ValidationFailed(round), ValidationFailed(fettmattis), EditWindowExpired(round/fettmattis), NotFound(player/round/fettmattis), DuplicatePlayerName.

### Performance & Scale

- Expected low write volume (manual entry). Provisional assumption: ≤ 1,500 rounds / year; fettmattiss volume expected ≤ rounds but monitor (PERF-CLAR-01). p95 leaderboard or player detail generation < 200ms at this scale; refine after real usage data.
- Yearly reset boundaries must not trigger full-table rewrites; derived calculations should remain incremental (business view only—implementation planning).

### Data / Privacy / Retention

- Retention: Indefinite historical rounds and fettmattiss (including revoked entries for audit) unless policy added (RET-CLAR-01).
- Soft deleted rounds and revoked fettmattiss excluded from user-facing statistics permanently.
- Year demarcation strictly by UTC calendar year.

### Error Handling (Updated)

- Validation errors MUST enumerate all failing fields in a single response/display.
- Edit / revoke window expiration MUST provide actionable message: “Item locked after 24h – create correction note via new record” (if correction pattern accepted—CORR-CLAR-01).
- Not Found MUST distinguish between deleted and never-existent if an audit UI is later provided (DISCUSS-CLAR-02).

### Migration (Legacy Laravel → New System)

- Legacy score & winner data WILL NOT be mapped (explicit deprecation). Migration MUST fail fast if encountering orphaned fettround indicators (former flag) now unsupported; these map to fettmattiss only if a deterministic transformation policy is later defined (would spawn MIG-CLAR-02).
- Historical rounds convert to: participants, loser (derived from legacy lowest score rule? MIG-CLAR-01) or flagged as “UNMAPPABLE” requiring manual intervention.
- Legacy fettround flags are NOT auto-converted to fettmattiss (manual recreation optional) unless a future rule is agreed (MIG-CLAR-02).
- Migration aborts on first structural inconsistency (missing loser resolvable rule) and reports summary for remediation.

### Assumptions & Out of Scope

- Assumed small informal community; no horizontal scaling phase required initially.
- Real-time updates (websocket/push) out of scope.
- Feature flags not required MVP.
- No ranking monetary incentives—fairness notice optional.

---

## Metrics Catalog (Reference)

| Metric                     | Type                 | Description                                           | Source                                  |
| -------------------------- | -------------------- | ----------------------------------------------------- | --------------------------------------- |
| totalPlayers               | Counter              | Total players ever created                            | Player records                          |
| activePlayers              | Gauge                | Current active players                                | Player.active                           |
| roundsYearToDate           | Counter              | Non-deleted rounds in current UTC year                | Round.created_at + deleted_at null      |
| fettmattissYearToDate      | Counter              | Non-revoked fettmattiss in current UTC year           | FettMattis.created_at + revoked_at null |
| avgParticipantsPerRoundYTD | Gauge                | Mean participants per non-deleted round (year)        | Derived                                 |
| losses                     | Counter (per player) | Times player designated loser this year               | Round.loser_id                          |
| participations             | Counter (per player) | Rounds player joined this year                        | Round participants                      |
| lossPercentage             | Gauge (per player)   | losses / total rounds in year                         | Derived                                 |
| playerFettMattiss          | Counter (per player) | FettMattiss granted to player this year (non-revoked) | FettMattis.player_id                    |

---

## Review & Acceptance Checklist

### Content Quality

- [ ] No implementation details leaked
- [ ] All business rules expressed clearly
- [ ] Legacy fettround flag concept removed / superseded by fettmattis model

### Non-Functional Coverage

- [ ] Accessibility impacts enumerated
- [ ] Security placeholder + abuse risks documented
- [ ] Observability metrics/events defined
- [ ] Performance targets stated (provisional assumption noted; pending PERF-CLAR-01 refinement)
- [ ] Data retention & deletion behavior clarified (soft delete / revoke)
- [ ] Migration risks & unmappable legacy paths noted

### Requirement Completeness

- [ ] All critical FRs present
- [ ] Remaining clarifications isolated in CLAR lists
- [ ] Testable acceptance scenarios mapped

---

## Execution Status

- [x] Legacy model replaced with loss-based model
- [x] Dual leaderboards defined (regular + fettmattis)
- [x] Yearly reset behavior defined
- [x] Edit/delete 24h window defined (rounds & fettmattiss)
- [x] Single loser constraint defined
- [x] Clarifications progress: 14 resolved, 0 open (All listed clarifications resolved on 2025-10-05)

---

## Resolved Clarifications

| ID              | Decision                                                                                                                                              | Rationale                                                                                                                                                      | Date       | Impacted Requirements                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| FR-CLAR-01      | Minimum participants per round is 2; codified via FR-003 & FR-014(d).                                                                                 | Ensures statistical relevance; legacy usage never <2 players; avoids degenerate single-player "round" inflating denominators.                                  | 2025-10-05 | FR-003, FR-014                                                                   |
| FR-CLAR-02      | Adopt standalone manual FettMattis (optional round link). No automatic derivation rule in MVP. No justification text field yet.                       | Maximizes flexibility with low implementation cost; defers complexity & abuse controls; preserves ability to later add thresholds/caps without data migration. | 2025-10-05 | FR-007 (revised), FR-009 (revised), FR-024–FR-027, Metrics Catalog, Key Entities |
| ABUSE-CLAR-01   | Defer hard caps initially; implement monitoring and alerting. Add rate-limit primitives to be applied later if abuse observed.                        | Low initial friction for community while ensuring observability; enables data‑driven cap policy later.                                                         | 2025-10-05 | FR-026, Security & Observability, Tasks (monitoring)                             |
| SEC-CLAR-01     | Phase 1: Anonymous reads, authenticated writes (basic actor model). Stronger auth (OIDC/roles) planned as follow-up.                                  | Balances quick MVP delivery with write accountability; allows later migration to federated auth (OIDC).                                                        | 2025-10-05 | Security & Supply Chain, FR-024–FR-027, Key Entities (User/Actor)                |
| SEC-CLAR-02     | Require rate limiting for write paths (round creation & fettmattiss) with user-id based keys and IP fallback; captcha deferred unless abuse observed. | Prevents automated mass writes while keeping UX friction low; ties into ABUSE monitoring.                                                                      | 2025-10-05 | FR-003, FR-024, Performance & Security sections                                  |
| PERF-CLAR-01    | Target Low scale for MVP: ≤10k rounds/year (adjusted from provisional 1,500 to stakeholder-confirmed low scale).                                      | Gives conservative headroom for indexing & caching choices without premature optimization.                                                                     | 2025-10-05 | Performance & Scale, Query budgets, Metrics                                      |
| RET-CLAR-01     | Indefinite retention for historical rounds and fettmattiss; no automatic purge in MVP.                                                                | Preserves auditability and historical analysis for community; revisit if storage concerns appear.                                                              | 2025-10-05 | Data / Privacy / Retention                                                       |
| MIG-CLAR-01     | Use legacy `loser_id` where present; if undeterminable, mark round as `UNMAPPABLE` and surface for manual remediation.                                | Preserves deterministic migration behavior and surfaces edge cases for manual cleanup.                                                                         | 2025-10-05 | Migration section, Round conversion rules                                        |
| CORR-CLAR-01    | Corrections implemented via new adjustment records (immutable history); do NOT mutate historical records post 24h—create compensating entry.          | Enforces auditability and avoids mutation of past events while enabling corrections.                                                                           | 2025-10-05 | Error Handling, FR-018, FR-027                                                   |
| DISCUSS-CLAR-02 | API semantics: return `410 Gone` for previously deleted items (when `deleted_at` present), `404 Not Found` for never-existent ids.                    | Makes intent explicit for clients and supports future audit UI to surface deleted items.                                                                       | 2025-10-05 | Error Handling, API Contracts                                                    |
| FR-CLAR-03      | Reactivation preserves continuity; reactivated players resume participation without historical renormalization; UI will show inactivity periods.      | Avoids disrupting historical statistics; provides context to users about gaps.                                                                                 | 2025-10-05 | FR-002, FR-012, FR-023                                                           |
| FR-CLAR-04      | Leaderboards WILL support year filter parameter (e.g., `?year=2024`) for historical browsing.                                                         | Supports stakeholder needs for historical comparisons without heavy UI changes.                                                                                | 2025-10-05 | FR-019, FR-008, FR-012                                                           |
| FR-CLAR-05      | Export functionality deferred for MVP: mark FR-020 as deferred/optional (remove from MVP requirements).                                               | Lowers MVP scope; export can be added as a follow-up task if requested.                                                                                        | 2025-10-05 | FR-020 (deferred)                                                                |
| FR-CLAR-06      | Show low-participation badge/tooltip instead of hiding players; include explanatory tooltip for fairness.                                             | Improves transparency and avoids removing players from community-visible leaderboards.                                                                         | 2025-10-05 | FR-008, FR-023                                                                   |

---

## Outstanding Clarifications Summary

None — all clarifications listed in this document were reviewed and resolved on 2025-10-05. The Resolved Clarifications table above reflects the final decisions and their rationale. If new clarification questions arise during implementation they will be registered as new CLAR IDs following the Clarification Documentation Guidelines below.

### Clarification Documentation Guidelines

To standardize how clarifications are captured and later referenced, each resolved clarification MUST include the following fields in the Resolved Clarifications table (or an appended table if capacity changes):

| Field                 | Description                                                                   |
| --------------------- | ----------------------------------------------------------------------------- |
| ID                    | The tracking identifier (e.g., FR-CLAR-02)                                    |
| Decision              | Concise statement of the chosen answer / rule                                 |
| Rationale             | Business reasoning (fairness, simplicity, legacy continuity, risk mitigation) |
| Impacted Requirements | List of FR / NFR IDs updated or validated by this decision                    |
| Date                  | UTC date of stakeholder confirmation                                          |
| Follow‑Ups (Optional) | New clarification IDs or tasks spawned                                        |

Process:

1. Propose: Add a "Proposal (Pending Decision)" subsection with enumerated candidate options (labelled Option A, B, C, …) including Pros / Cons and Impact notes. Do NOT change core FR text yet—only reference via placeholder.
2. Stakeholder Selection: Once an option is approved, update: (a) Resolved Clarifications table (b) Affected FR(s) language (remove placeholder wording) (c) Execution Status counts (resolved/open) (d) Any acceptance scenarios referencing the placeholder.
3. Traceability: If the decision introduces new secondary questions, register them as new CLAR IDs in Outstanding list.
4. Non‑Adopted Options: Leave summarized in commit history only (not retained in spec body) to avoid drift.

_If additional unresolved items are found during implementation they should be added as new CLAR IDs and tracked with the same process._
