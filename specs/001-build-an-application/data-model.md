# Phase 1: Data Model

**Status**: Completed

This document defines the database schema for the Mattis Stats application. The model is designed for a PostgreSQL database and is described in a way that can be directly translated into a Drizzle ORM schema.

---

### Schema Diagram (Conceptual)

```
+-------------+       +--------------------+       +-------------------+
|   Users     |       |      Players       |       | FettMattis |
|-------------|       |--------------------|       |-------------------|
| id (PK)     |----<--| id (PK)            |----<--| id (PK)           |
| username    |       | display_name       |       | player_id (FK)    |
| ...         |       | user_id (FK, null) |       | round_id (FK, null) |
+-------------+       | active             |       | created_at        |
                      | ...                |       | created_by (FK)   |
                      +--------------------+       | revoked_at (null) |
                               |                   +-------------------+
                               |
+-------------------------+    |
|   Rounds                |    |
|-------------------------|    |
| id (PK)                 |    |
| created_at              |    |
| created_by (FK)         |    |
| deleted_at (null)       |    |
+-------------------------+    |
    |           |              |
    |           |              |
+--------------------------+ +--------------------------+
| RoundParticipants (Join) | | RoundLoser (1-to-1)      |
|--------------------------| |--------------------------|
| round_id (FK)            | | round_id (PK, FK)        |
| player_id (FK)           | | loser_id (FK) -> Players |
+--------------------------+ +--------------------------+
      |           |
      '-----------'-----------> Players
```

---

### Table Definitions

#### `users`

Stores authentication information. Separate from the `players` entity that represents game participants.

| Column       | Type          | Constraints               | Description                     |
| ------------ | ------------- | ------------------------- | ------------------------------- |
| `id`         | `uuid (v7)`   | Primary Key               | Unique identifier for the user. |
| `username`   | `varchar`     | Unique, Not Null          | User's login name.              |
| `created_at` | `timestamptz` | Not Null, Default `now()` | Timestamp of user creation.     |
| `updated_at` | `timestamptz` | Not Null, Default `now()` | Timestamp of last user update.  |

#### `players`

Stores profiles for game participants.

| Column         | Type          | Constraints                         | Description                                    |
| -------------- | ------------- | ----------------------------------- | ---------------------------------------------- |
| `id`           | `uuid (v7)`   | Primary Key                         | Unique identifier for the player.              |
| `display_name` | `varchar`     | Unique (case-insensitive), Not Null | The name displayed on leaderboards.            |
| `user_id`      | `uuid (v7)`   | Foreign Key -> `users.id`, Nullable | Link to an authenticated user.                 |
| `active`       | `boolean`     | Not Null, Default `true`            | Whether the player can be added to new rounds. |
| `created_at`   | `timestamptz` | Not Null, Default `now()`           | Timestamp of player creation.                  |
| `updated_at`   | `timestamptz` | Not Null, Default `now()`           | Timestamp of last player update.               |

#### `rounds`

Represents a single game round.

| Column       | Type          | Constraints                         | Description                                        |
| ------------ | ------------- | ----------------------------------- | -------------------------------------------------- |
| `id`         | `uuid (v7)`   | Primary Key                         | Unique identifier for the round.                   |
| `created_by` | `uuid (v7)`   | Foreign Key -> `users.id`, Not Null | The user who recorded the round.                   |
| `created_at` | `timestamptz` | Not Null, Default `now()`           | Timestamp of round creation (used for 24h window). |
| `deleted_at` | `timestamptz` | Nullable                            | Timestamp for soft deletion.                       |

#### `round_participants` (Join Table)

Associates players with rounds.

| Column      | Type        | Constraints                              | Description                        |
| ----------- | ----------- | ---------------------------------------- | ---------------------------------- |
| `round_id`  | `uuid (v7)` | Primary Key, Foreign Key -> `rounds.id`  | Part of the composite primary key. |
| `player_id` | `uuid (v7)` | Primary Key, Foreign Key -> `players.id` | Part of the composite primary key. |

#### `round_loser`

Identifies the single loser for a round. A separate table enforces the one-to-one relationship.

| Column     | Type        | Constraints                             | Description                      |
| ---------- | ----------- | --------------------------------------- | -------------------------------- |
| `round_id` | `uuid (v7)` | Primary Key, Foreign Key -> `rounds.id` | A round can only have one loser. |
| `loser_id` | `uuid (v7)` | Foreign Key -> `players.id`, Not Null   | The player who lost the round.   |

**Constraint**: The `loser_id` must be one of the players in `round_participants` for the given `round_id`. This will be enforced at the application layer.

#### `fettmattis`

Stores records of FettMattis.

| Column       | Type          | Constraints                           | Description                                  |
| ------------ | ------------- | ------------------------------------- | -------------------------------------------- |
| `id`         | `uuid (v7)`   | Primary Key                           | Unique identifier for the FettMattis record. |
| `player_id`  | `uuid (v7)`   | Foreign Key -> `players.id`, Not Null | The player receiving the FettMattis.         |
| `round_id`   | `uuid (v7)`   | Foreign Key -> `rounds.id`, Nullable  | The round associated with the fettmattis.    |
| `created_by` | `uuid (v7)`   | Foreign Key -> `users.id`, Not Null   | The user who gave the fettmattis.            |
| `created_at` | `timestamptz` | Not Null, Default `now()`             | Timestamp of FettMattis creation.            |
| `revoked_at` | `timestamptz` | Nullable                              | Timestamp for soft deletion (revocation).    |

**Constraint**: A unique index on `(player_id, round_id)` where `revoked_at IS NULL` will enforce that a player can only receive one FettMattis per round.

### Derived Data

- **Yearly Statistics**: Metrics like `loss_percentage`, `participation_count`, and `fettmattis_count` are derived on-the-fly from the base tables for a given calendar year (UTC). They will not be stored in a separate table unless performance analysis proves it necessary, in which case a materialized view could be created.
