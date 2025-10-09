import "dotenv/config";

import { randomUUID } from "node:crypto";

import type { Pool as MySqlPool, RowDataPacket } from "mysql2/promise";
import { createPool } from "mysql2/promise";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool as PostgresPool } from "pg";

import * as schema from "@/lib/db/schema";

type TargetDatabase = NodePgDatabase<typeof schema>;

type UserInsertRow = typeof schema.users.$inferInsert;
type PlayerInsertRow = typeof schema.players.$inferInsert;
type RoundInsertRow = typeof schema.rounds.$inferInsert;
type RoundLoserInsertRow = typeof schema.roundLoser.$inferInsert;
type RoundParticipantInsertRow = typeof schema.roundParticipants.$inferInsert;
type FettMattisInsertRow = typeof schema.fettmattis.$inferInsert;

type LegacyDateValue = Date | string | null;

interface SourceUserRow extends RowDataPacket {
  id: number;
  username: string;
  created_at: LegacyDateValue;
  updated_at: LegacyDateValue;
}

interface SourcePlayerRow extends RowDataPacket {
  id: number;
  name: string;
  created_at: LegacyDateValue;
  updated_at: LegacyDateValue;
}

interface SourceRoundRow extends RowDataPacket {
  id: number;
  loser_id: number | null;
  created_at: LegacyDateValue;
  updated_at: LegacyDateValue;
}

interface SourcePlayerRoundRow extends RowDataPacket {
  player_id: number;
  round_id: number;
}

interface SourceFettRoundRow extends RowDataPacket {
  id: number;
  loser_id: number | null;
  created_at: LegacyDateValue;
  updated_at: LegacyDateValue;
}

interface SourceData {
  users: SourceUserRow[];
  players: SourcePlayerRow[];
  rounds: SourceRoundRow[];
  playerRounds: SourcePlayerRoundRow[];
  fettRounds: SourceFettRoundRow[];
}

interface MigrationOptions {
  readonly migrationUserId: string;
  readonly migrationUsername: string;
}

const INFO_PREFIX = "[migrate]";
const WARN_PREFIX = "[migrate:warn]";
const ERROR_PREFIX = "[migrate:error]";

async function main(): Promise<void> {
  const sourceUrl = process.env.SOURCE_DATABASE_URL;
  const targetUrl = process.env.TARGET_DATABASE_URL ?? process.env.DATABASE_URL;

  if (!sourceUrl) {
    throw new Error("SOURCE_DATABASE_URL must be defined.");
  }

  if (!targetUrl) {
    throw new Error(
      "Provide DATABASE_URL or TARGET_DATABASE_URL with the Postgres connection string.",
    );
  }

  const migrationUserId =
    process.env.MIGRATION_CREATED_BY_USER_ID ?? randomUUID();
  const migrationUsername =
    process.env.MIGRATION_CREATED_BY_USERNAME ?? "legacy-importer";

  writeInfo("Connecting to source MySQL database…");
  const mysqlPool = createMySqlPool(sourceUrl);

  let sourceData: SourceData | null = null;

  try {
    sourceData = await fetchSourceData(mysqlPool);
  } finally {
    await mysqlPool.end();
  }

  writeInfo("Connecting to target Postgres database…");
  const pgPool = new PostgresPool({ connectionString: targetUrl });
  const db = drizzle(pgPool, { schema });

  try {
    await ensureTargetIsEmpty(db);
    await migrateData(db, sourceData, { migrationUserId, migrationUsername });
    writeInfo("Migration completed successfully.");
  } finally {
    await pgPool.end();
  }
}

function createMySqlPool(connectionString: string): MySqlPool {
  return createPool({
    uri: connectionString,
    waitForConnections: true,
    connectionLimit: 10,
    timezone: "Z",
    dateStrings: false,
  });
}

async function fetchSourceData(pool: MySqlPool): Promise<SourceData> {
  const [users] = await pool.query<SourceUserRow[]>(
    "SELECT id, username, created_at, updated_at FROM users ORDER BY id ASC",
  );
  const [players] = await pool.query<SourcePlayerRow[]>(
    "SELECT id, name, created_at, updated_at FROM players ORDER BY id ASC",
  );
  const [rounds] = await pool.query<SourceRoundRow[]>(
    "SELECT id, loser_id, created_at, updated_at FROM rounds ORDER BY id ASC",
  );
  const [playerRounds] = await pool.query<SourcePlayerRoundRow[]>(
    "SELECT player_id, round_id FROM player_round ORDER BY id ASC",
  );
  const [fettRounds] = await pool.query<SourceFettRoundRow[]>(
    "SELECT id, loser_id, created_at, updated_at FROM fettrounds ORDER BY id ASC",
  );

  const messages = [
    `Fetched ${users.length.toString()} users`,
    `${players.length.toString()} players`,
    `${rounds.length.toString()} rounds`,
    `${playerRounds.length.toString()} round participations`,
    `${fettRounds.length.toString()} FettMattis awards`,
  ];

  writeInfo(messages.join(", "));

  return { users, players, rounds, playerRounds, fettRounds };
}

async function ensureTargetIsEmpty(db: TargetDatabase): Promise<void> {
  const tableChecks = await Promise.all([
    db.select({ id: schema.users.id }).from(schema.users).limit(1),
    db.select({ id: schema.players.id }).from(schema.players).limit(1),
    db.select({ id: schema.rounds.id }).from(schema.rounds).limit(1),
    db
      .select({ id: schema.roundParticipants.roundId })
      .from(schema.roundParticipants)
      .limit(1),
    db
      .select({ id: schema.roundLoser.roundId })
      .from(schema.roundLoser)
      .limit(1),
    db.select({ id: schema.fettmattis.id }).from(schema.fettmattis).limit(1),
  ]);

  const hasExistingData = tableChecks.some((rows) => rows.length > 0);

  if (hasExistingData) {
    throw new Error(
      "Target database tables already contain data. Clear the database before running the migration.",
    );
  }
}

async function migrateData(
  db: TargetDatabase,
  sourceData: SourceData,
  options: MigrationOptions,
): Promise<void> {
  const playerIdMap = new Map<number, string>();

  const participantsByRound = groupParticipants(sourceData.playerRounds);

  const warnings: string[] = [];

  await db.transaction(async (tx) => {
    await ensureMigrationUser(tx, options);
    await migrateLegacyUsers(tx, sourceData.users);
    const playerWarnings = await migrateLegacyPlayers(
      tx,
      sourceData.players,
      playerIdMap,
    );
    warnings.push(...playerWarnings);

    const roundInsertData = buildRoundInsertData(
      sourceData.rounds,
      participantsByRound,
      playerIdMap,
      options,
    );
    warnings.push(...roundInsertData.warnings);
    await insertRounds(tx, roundInsertData);

    const fettMattisInsert = buildFettMattisInsert(
      sourceData.fettRounds,
      playerIdMap,
      options,
    );
    warnings.push(...fettMattisInsert.warnings);
    await insertFettMattis(tx, fettMattisInsert.items);
  });

  if (warnings.length > 0) {
    writeWarn("Migration completed with warnings:");
    for (const warning of warnings) {
      writeWarn(`- ${warning}`);
    }
  }
}

async function ensureMigrationUser(
  tx: TargetDatabase,
  options: MigrationOptions,
): Promise<void> {
  const now = new Date();
  const migrationUser: UserInsertRow = {
    id: options.migrationUserId,
    username: options.migrationUsername,
    createdAt: now,
    updatedAt: now,
  };

  await tx.insert(schema.users).values(migrationUser).onConflictDoNothing();
}

async function migrateLegacyUsers(
  tx: TargetDatabase,
  users: SourceUserRow[],
): Promise<void> {
  if (users.length === 0) {
    return;
  }

  const userValues: UserInsertRow[] = users.map((row) => ({
    id: randomUUID(),
    username: row.username,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at ?? row.created_at),
  }));

  await tx.insert(schema.users).values(userValues).onConflictDoNothing();
}

async function migrateLegacyPlayers(
  tx: TargetDatabase,
  players: SourcePlayerRow[],
  playerIdMap: Map<number, string>,
): Promise<string[]> {
  const warnings: string[] = [];

  if (players.length === 0) {
    return warnings;
  }

  const usedDisplayNames = new Set<string>();

  const playerValues: PlayerInsertRow[] = players.map((row) => {
    const id = randomUUID();
    playerIdMap.set(row.id, id);

    const { displayName, warnings: displayNameWarnings } =
      resolvePlayerDisplayName(row.name, row.id, usedDisplayNames);
    warnings.push(...displayNameWarnings);

    return {
      id,
      displayName,
      userId: null,
      active: true,
      createdAt: toDate(row.created_at),
      updatedAt: toDate(row.updated_at ?? row.created_at),
    } satisfies PlayerInsertRow;
  });

  await tx.insert(schema.players).values(playerValues);

  return warnings;
}

function resolvePlayerDisplayName(
  rawName: string | null | undefined,
  legacyPlayerId: number,
  usedDisplayNames: Set<string>,
): { displayName: string; warnings: string[] } {
  const localWarnings: string[] = [];
  const trimmedName = rawName?.trim() ?? "";

  let baseName = trimmedName;

  if (baseName.length === 0) {
    baseName = `Legacy player ${formatLegacyId(legacyPlayerId)}`;
    localWarnings.push(
      `Player ${formatLegacyId(legacyPlayerId)} had empty display name and was renamed to "${baseName}".`,
    );
  }

  let uniqueName = baseName;
  let suffix = 1;

  while (usedDisplayNames.has(uniqueName)) {
    suffix += 1;
    uniqueName = `${baseName} (${suffix})`;
  }

  usedDisplayNames.add(uniqueName);

  if (suffix > 1) {
    localWarnings.push(
      `Player ${formatLegacyId(legacyPlayerId)} had duplicate display name "${baseName}" and was renamed to "${uniqueName}".`,
    );
  }

  return { displayName: uniqueName, warnings: localWarnings };
}

interface RoundInsertData {
  rounds: RoundInsertRow[];
  roundLosers: RoundLoserInsertRow[];
  participants: RoundParticipantInsertRow[];
  warnings: string[];
}

function buildRoundInsertData(
  rounds: SourceRoundRow[],
  participantsByRound: Map<number, SourcePlayerRoundRow[]>,
  playerIdMap: Map<number, string>,
  options: MigrationOptions,
): RoundInsertData {
  const roundValues: RoundInsertRow[] = [];
  const roundLoserValues: RoundLoserInsertRow[] = [];
  const participantValues: RoundParticipantInsertRow[] = [];
  const warnings: string[] = [];

  for (const round of rounds) {
    if (round.loser_id === null) {
      warnings.push(
        `Skipping round ${formatLegacyId(round.id)} because it has no recorded loser.`,
      );
      continue;
    }

    const loserId = playerIdMap.get(round.loser_id);

    if (!loserId) {
      warnings.push(
        `Skipping round ${formatLegacyId(round.id)} because loser ${formatLegacyId(round.loser_id)} was not found in players.`,
      );
      continue;
    }

    const newRoundId = randomUUID();

    roundValues.push({
      id: newRoundId,
      createdBy: options.migrationUserId,
      createdAt: toDate(round.created_at),
      deletedAt: null,
    });

    roundLoserValues.push({
      roundId: newRoundId,
      loserId,
    });

    const participants = participantsByRound.get(round.id) ?? [];

    if (participants.length === 0) {
      warnings.push(
        `Round ${formatLegacyId(round.id)} has no participants and was migrated without them.`,
      );
    }

    const participantKeys = new Set<string>();

    for (const participant of participants) {
      const participantId = playerIdMap.get(participant.player_id);

      if (!participantId) {
        warnings.push(
          `Participant ${formatLegacyId(participant.player_id)} for round ${formatLegacyId(round.id)} could not be resolved and was skipped.`,
        );
        continue;
      }

      const key = `${newRoundId}:${participantId}`;

      if (participantKeys.has(key)) {
        continue;
      }

      participantKeys.add(key);

      participantValues.push({
        roundId: newRoundId,
        playerId: participantId,
      });
    }
  }

  return {
    rounds: roundValues,
    roundLosers: roundLoserValues,
    participants: participantValues,
    warnings,
  };
}

async function insertRounds(
  tx: TargetDatabase,
  data: RoundInsertData,
): Promise<void> {
  if (data.rounds.length > 0) {
    await tx.insert(schema.rounds).values(data.rounds);
  }

  if (data.roundLosers.length > 0) {
    await tx.insert(schema.roundLoser).values(data.roundLosers);
  }

  if (data.participants.length > 0) {
    await tx.insert(schema.roundParticipants).values(data.participants);
  }
}

interface FettMattisInsert {
  items: FettMattisInsertRow[];
  warnings: string[];
}

function buildFettMattisInsert(
  rows: SourceFettRoundRow[],
  playerIdMap: Map<number, string>,
  options: MigrationOptions,
): FettMattisInsert {
  const warnings: string[] = [];

  const items: FettMattisInsertRow[] = rows
    .map((row) => {
      if (row.loser_id === null) {
        warnings.push(
          `Skipping FettMattis ${formatLegacyId(row.id)} because it has no associated player.`,
        );
        return null;
      }

      const playerId = playerIdMap.get(row.loser_id);

      if (!playerId) {
        warnings.push(
          `Skipping FettMattis ${formatLegacyId(row.id)} because player ${formatLegacyId(row.loser_id)} could not be resolved.`,
        );
        return null;
      }

      const item: FettMattisInsertRow = {
        id: randomUUID(),
        playerId,
        roundId: null,
        createdBy: options.migrationUserId,
        createdAt: toDate(row.created_at),
        revokedAt: null,
      };

      return item;
    })
    .filter((value): value is FettMattisInsertRow => value !== null);

  return { items, warnings };
}

async function insertFettMattis(
  tx: TargetDatabase,
  items: FettMattisInsertRow[],
): Promise<void> {
  if (items.length === 0) {
    return;
  }

  await tx.insert(schema.fettmattis).values(items);
}

function groupParticipants(
  rows: SourcePlayerRoundRow[],
): Map<number, SourcePlayerRoundRow[]> {
  const grouped = new Map<number, SourcePlayerRoundRow[]>();

  for (const row of rows) {
    const existing = grouped.get(row.round_id);

    if (existing) {
      existing.push(row);
      continue;
    }

    grouped.set(row.round_id, [row]);
  }

  return grouped;
}

function toDate(value: LegacyDateValue | undefined, fallback?: Date): Date {
  if (value instanceof Date) {
    return new Date(value);
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return fallback ?? new Date();
}

function formatLegacyId(id: number | null | undefined): string {
  if (typeof id === "number") {
    return id.toString();
  }

  if (id === null) {
    return "null";
  }

  return "undefined";
}

function writeInfo(message: string): void {
  process.stdout.write(`${INFO_PREFIX} ${message}\n`);
}

function writeWarn(message: string): void {
  process.stderr.write(`${WARN_PREFIX} ${message}\n`);
}

function writeError(message: string): void {
  process.stderr.write(`${ERROR_PREFIX} ${message}\n`);
}

main().catch((error: unknown) => {
  writeError(
    error instanceof Error ? (error.stack ?? error.message) : String(error),
  );
  process.exitCode = 1;
});
