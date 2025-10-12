import { asc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/lib/db/db";
import {
  fettmattis,
  players,
  roundLoser,
  roundParticipants,
  rounds,
  users,
} from "@/lib/db/schema";

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

type TransactionClient = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbExecutor = typeof db | TransactionClient;

type PlayerRow = typeof players.$inferSelect;
export interface PlayerRecord {
  id: string;
  displayName: string;
  active: boolean;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoundParticipantRecord {
  id: string;
  displayName: string;
  active: boolean;
}

export interface RoundRecord {
  id: string;
  createdAt: Date;
  createdBy: string;
  deletedAt: Date | null;
  participants: RoundParticipantRecord[];
  loser: RoundParticipantRecord;
}

export interface FettMattisRecord {
  id: string;
  player: RoundParticipantRecord;
  createdAt: Date;
  createdBy: string;
  revokedAt: Date | null;
}

export interface CreatePlayerInput {
  displayName: string;
  id?: string;
  userId?: string | null;
}

export interface UpdatePlayerInput {
  displayName?: string;
  active?: boolean;
}

export interface CreateRoundInput {
  participantIds: string[];
  loserId: string;
  createdBy: string;
}

export interface UpdateRoundInput {
  participantIds?: string[];
  loserId?: string;
}

export interface CreateFettMattisInput {
  playerId: string;
  createdBy: string;
}

export class NotFoundError extends Error {}
export class ConflictError extends Error {}
export class ForbiddenError extends Error {}

function mapPlayer(row: PlayerRow): PlayerRecord {
  const record = row as Record<string, unknown>;
  return {
    id: (readRowValue(record, "id") as string | undefined) ?? row.id,
    displayName:
      (readRowValue(record, "displayName") as string | undefined) ??
      row.displayName,
    active:
      (readRowValue(record, "active") as boolean | undefined) ?? row.active,
    userId:
      (readRowValue(record, "userId") as string | null | undefined) ??
      row.userId ??
      null,
    createdAt:
      (readRowValue(record, "createdAt") as Date | undefined) ?? row.createdAt,
    updatedAt:
      (readRowValue(record, "updatedAt") as Date | undefined) ?? row.updatedAt,
  };
}

function mapParticipant(
  row: Pick<PlayerRow, "id" | "displayName" | "active">,
): RoundParticipantRecord {
  const record = row as Record<string, unknown>;
  return {
    id: (readRowValue(record, "id") as string | undefined) ?? row.id,
    displayName:
      (readRowValue(record, "displayName") as string | undefined) ??
      row.displayName,
    active:
      (readRowValue(record, "active") as boolean | undefined) ?? row.active,
  };
}

function assertEditWindow(createdAt: Date, entity: string): void {
  const now = Date.now();
  if (now - createdAt.getTime() > EDIT_WINDOW_MS) {
    throw new ForbiddenError(`${entity} is locked after 24 hours.`);
  }
}

async function ensureUser(client: DbExecutor, userId: string): Promise<void> {
  if (!userId) {
    throw new Error("User identifier is required.");
  }

  const existing = await client.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (existing) {
    return;
  }

  const username = `dev-${userId.slice(0, 8)}`;

  await client
    .insert(users)
    .values({ id: userId, username })
    .onConflictDoNothing();
}

async function loadRound(
  client: DbExecutor,
  roundId: string,
): Promise<RoundRecord | null> {
  const [roundRow] = await client
    .select()
    .from(rounds)
    .where(eq(rounds.id, roundId))
    .limit(1);

  if (!roundRow) {
    return null;
  }

  const participantRows = await client
    .select({
      id: players.id,
      displayName: players.displayName,
      active: players.active,
    })
    .from(roundParticipants)
    .innerJoin(players, eq(roundParticipants.playerId, players.id))
    .where(eq(roundParticipants.roundId, roundId));

  const [loserRow] = await client
    .select({
      id: players.id,
      displayName: players.displayName,
      active: players.active,
    })
    .from(roundLoser)
    .innerJoin(players, eq(roundLoser.loserId, players.id))
    .where(eq(roundLoser.roundId, roundId))
    .limit(1);

  if (!loserRow) {
    throw new ConflictError("Round is missing loser information.");
  }

  const participants = participantRows.map((entry) => mapParticipant(entry));

  return {
    id: roundRow.id,
    createdAt: roundRow.createdAt,
    createdBy: roundRow.createdBy,
    deletedAt: roundRow.deletedAt,
    participants,
    loser: mapParticipant(loserRow),
  };
}

function uniqueIds(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

function readRowValue(row: Record<string, unknown>, key: string): unknown {
  if (key in row && row[key] !== undefined) {
    return row[key];
  }

  const snakeKey = toSnakeCase(key);
  if (snakeKey in row && row[snakeKey] !== undefined) {
    return row[snakeKey];
  }

  return undefined;
}

function toSnakeCase(value: string): string {
  return value.replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`);
}

function assertParticipantsContainLoser(
  participantIds: string[],
  loserId: string,
): void {
  if (!participantIds.includes(loserId)) {
    throw new ConflictError("Loser must be included in participant list.");
  }
}

async function fetchPlayers(
  client: DbExecutor,
  ids: string[],
): Promise<PlayerRow[]> {
  if (ids.length === 0) {
    return [];
  }

  const rows = await client
    .select()
    .from(players)
    .where(inArray(players.id, ids));

  return rows;
}

export async function createPlayer(
  input: CreatePlayerInput,
): Promise<PlayerRecord> {
  const now = new Date();

  try {
    const [row] = await db
      .insert(players)
      .values({
        ...(input.id ? { id: input.id } : {}),
        displayName: input.displayName,
        userId: input.userId ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!row) {
      throw new Error("Failed to insert player.");
    }

    return mapPlayer(row);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError(
        "A player with that display name already exists.",
      );
    }
    throw error;
  }
}

export async function listPlayers(): Promise<PlayerRecord[]> {
  const rows = await db
    .select()
    .from(players)
    .orderBy(asc(players.displayName));
  return rows.map(mapPlayer);
}

export async function getPlayerById(playerId: string): Promise<PlayerRecord> {
  const row = await db.query.players.findFirst({
    where: eq(players.id, playerId),
  });

  if (!row) {
    throw new NotFoundError("Player not found.");
  }

  return mapPlayer(row);
}

export async function updatePlayer(
  playerId: string,
  input: UpdatePlayerInput,
): Promise<PlayerRecord> {
  if (!input.displayName && typeof input.active === "undefined") {
    return getPlayerById(playerId);
  }

  const now = new Date();

  try {
    const [row] = await db
      .update(players)
      .set({
        ...(input.displayName ? { displayName: input.displayName } : {}),
        ...(typeof input.active === "boolean" ? { active: input.active } : {}),
        updatedAt: now,
      })
      .where(eq(players.id, playerId))
      .returning();

    if (!row) {
      throw new NotFoundError("Player not found.");
    }

    return mapPlayer(row);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError(
        "A player with that display name already exists.",
      );
    }
    throw error;
  }
}

export async function createRound(
  input: CreateRoundInput,
): Promise<RoundRecord> {
  const participantIds = uniqueIds(input.participantIds);
  assertParticipantsContainLoser(participantIds, input.loserId);

  return db.transaction(async (tx) => {
    await ensureUser(tx, input.createdBy);

    const playersForRound = await fetchPlayers(tx, participantIds);
    if (playersForRound.length !== participantIds.length) {
      throw new NotFoundError("One or more participants do not exist.");
    }

    const now = new Date();

    const [roundRow] = await tx
      .insert(rounds)
      .values({
        createdBy: input.createdBy,
        createdAt: now,
      })
      .returning();

    if (!roundRow) {
      throw new Error("Failed to create round.");
    }

    const roundId = roundRow.id;

    const participantValues = participantIds.map((playerId) => ({
      roundId,
      playerId,
    }));

    await tx.insert(roundParticipants).values(participantValues);

    await tx
      .insert(roundLoser)
      .values({
        roundId,
        loserId: input.loserId,
      })
      .onConflictDoUpdate({
        target: roundLoser.roundId,
        set: {
          loserId: input.loserId,
        },
      });

    const loaded = await loadRound(tx, roundId);

    if (!loaded) {
      throw new Error("Unable to load newly created round.");
    }

    return loaded;
  });
}

export async function getRoundById(roundId: string): Promise<RoundRecord> {
  const round = await loadRound(db, roundId);

  if (!round || round.deletedAt) {
    throw new NotFoundError("Round not found.");
  }

  return round;
}

export async function updateRound(
  roundId: string,
  input: UpdateRoundInput,
): Promise<RoundRecord> {
  return db.transaction(async (tx) => {
    const existing = await loadRound(tx, roundId);

    if (!existing || existing.deletedAt) {
      throw new NotFoundError("Round not found.");
    }

    assertEditWindow(existing.createdAt, "Round");

    const participantIds = uniqueIds(
      input.participantIds ??
        existing.participants.map((participant) => participant.id),
    );
    const loserId = input.loserId ?? existing.loser.id;

    assertParticipantsContainLoser(participantIds, loserId);

    const playersForRound = await fetchPlayers(tx, participantIds);
    if (playersForRound.length !== participantIds.length) {
      throw new NotFoundError("One or more participants do not exist.");
    }

    await tx
      .delete(roundParticipants)
      .where(eq(roundParticipants.roundId, roundId));

    await tx.insert(roundParticipants).values(
      participantIds.map((playerId) => ({
        roundId,
        playerId,
      })),
    );

    await tx
      .insert(roundLoser)
      .values({
        roundId,
        loserId,
      })
      .onConflictDoUpdate({
        target: roundLoser.roundId,
        set: {
          loserId,
        },
      });

    const updated = await loadRound(tx, roundId);

    if (!updated) {
      throw new Error("Unable to load updated round.");
    }

    return updated;
  });
}

export async function deleteRound(roundId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [roundRow] = await tx
      .select()
      .from(rounds)
      .where(eq(rounds.id, roundId))
      .limit(1);

    if (!roundRow) {
      throw new NotFoundError("Round not found.");
    }

    if (roundRow.deletedAt) {
      return;
    }

    assertEditWindow(roundRow.createdAt, "Round");

    await tx
      .update(rounds)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(rounds.id, roundId));
  });
}

export async function createFettMattis(
  input: CreateFettMattisInput,
): Promise<FettMattisRecord> {
  return db.transaction(async (tx) => {
    await ensureUser(tx, input.createdBy);

    const playerRow = await tx.query.players.findFirst({
      where: eq(players.id, input.playerId),
    });

    if (!playerRow) {
      throw new NotFoundError("Player not found.");
    }

    const now = new Date();

    const [row] = await tx
      .insert(fettmattis)
      .values({
        playerId: input.playerId,
        createdBy: input.createdBy,
        createdAt: now,
      })
      .returning();

    if (!row) {
      throw new Error("Failed to create Fettmattis.");
    }

    return {
      id: row.id,
      player: mapParticipant(playerRow),
      createdAt: row.createdAt,
      createdBy: row.createdBy,
      revokedAt: row.revokedAt,
    };
  });
}

export async function revokeFettMattis(fettmattisId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(fettmattis)
      .where(eq(fettmattis.id, fettmattisId))
      .limit(1);

    if (!row) {
      throw new NotFoundError("Fettmattis not found.");
    }

    if (row.revokedAt) {
      return;
    }

    assertEditWindow(row.createdAt, "FettMattis");

    await tx
      .update(fettmattis)
      .set({ revokedAt: new Date() })
      .where(eq(fettmattis.id, fettmattisId));
  });
}

export interface RegularLeaderboardEntry {
  rank: number;
  lossPercentage: number;
  participationCount: number;
  lossCount: number;
  player: RoundParticipantRecord;
}

export interface FettMattisLeaderboardEntry {
  rank: number;
  fettMattisCount: number;
  player: RoundParticipantRecord;
}

interface RegularLeaderboardRow extends Record<string, unknown> {
  player_id: string;
  display_name: string;
  active: boolean;
  participation_count: number;
  loss_count: number;
}

interface FettMattisLeaderboardRow extends Record<string, unknown> {
  player_id: string;
  display_name: string;
  active: boolean;
  fettmattis_count: number;
}

export async function getRegularLeaderboard(
  year: number | null,
): Promise<RegularLeaderboardEntry[]> {
  const res = await db.execute<RegularLeaderboardRow>(
    regularLeaderboardQuery(year),
  );

  const leaderboard = res.rows
    .map(
      (
        row,
      ): {
        player: RoundParticipantRecord;
        participationCount: number;
        lossCount: number;
        lossPercentage: number;
      } => {
        const participationCount = row.participation_count;
        const lossCount = row.loss_count;
        const lossPercentage =
          participationCount === 0 ? 0 : (lossCount / participationCount) * 100;

        return {
          player: {
            id: row.player_id,
            displayName: row.display_name,
            active: row.active,
          },
          participationCount,
          lossCount,
          lossPercentage,
        };
      },
    )
    .sort((a, b) => {
      if (a.lossPercentage !== b.lossPercentage) {
        return b.lossPercentage - a.lossPercentage;
      }
      if (a.participationCount !== b.participationCount) {
        return b.participationCount - a.participationCount;
      }
      return a.player.displayName.localeCompare(b.player.displayName);
    });

  return leaderboard.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

export async function getFettMattisLeaderboard(
  year: number | null,
): Promise<FettMattisLeaderboardEntry[]> {
  const res = await db.execute<FettMattisLeaderboardRow>(
    fettMattisLeaderboardQuery(year),
  );

  const leaderboard = res.rows
    .map(
      (row): { player: RoundParticipantRecord; fettMattisCount: number } => ({
        player: {
          id: row.player_id,
          displayName: row.display_name,
          active: row.active,
        },
        fettMattisCount: row.fettmattis_count,
      }),
    )
    .sort((a, b) => {
      if (a.fettMattisCount !== b.fettMattisCount) {
        return b.fettMattisCount - a.fettMattisCount;
      }
      return a.player.displayName.localeCompare(b.player.displayName);
    });

  return leaderboard.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

function regularLeaderboardQuery(year: number | null) {
  const yearFilter =
    typeof year === "number"
      ? sql`AND EXTRACT(YEAR FROM ${rounds.createdAt}) = ${year}`
      : sql``;

  return sql`
    WITH eligible_rounds AS (
      SELECT id
      FROM ${rounds}
      WHERE ${rounds.deletedAt} IS NULL
        ${yearFilter}
    ),
    participation AS (
      SELECT
        rp.player_id,
        COUNT(*) AS participation_count
      FROM ${roundParticipants} rp
      JOIN eligible_rounds er ON er.id = rp.round_id
      GROUP BY rp.player_id
    ),
    losses AS (
      SELECT
        rl.loser_id AS player_id,
        COUNT(*) AS loss_count
      FROM ${roundLoser} rl
      JOIN eligible_rounds er ON er.id = rl.round_id
      GROUP BY rl.loser_id
    )
    SELECT
      p.id AS player_id,
      p.display_name,
      p.active,
      participation.participation_count,
      COALESCE(losses.loss_count, 0) AS loss_count
    FROM participation
    JOIN ${players} p ON p.id = participation.player_id
    LEFT JOIN losses ON losses.player_id = participation.player_id;
  `;
}

function fettMattisLeaderboardQuery(year: number | null): SQL {
  const yearFilter =
    typeof year === "number"
      ? sql`AND EXTRACT(YEAR FROM f.created_at) = ${year}`
      : sql``;

  return sql`
    SELECT
      p.id AS player_id,
      p.display_name,
      p.active,
      COUNT(f.id) AS fettmattis_count
    FROM ${fettmattis} f
    JOIN ${players} p ON p.id = f.player_id
    WHERE f.revoked_at IS NULL
      ${yearFilter}
    GROUP BY p.id, p.display_name, p.active;
  `;
}

export interface OverviewStats {
  totalRounds: number;
  fettMattisMoments: number;
  activePlayers: number;
}

export async function getOverviewStats(): Promise<OverviewStats> {
  const [roundsEntry] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(rounds)
    .where(isNull(rounds.deletedAt));

  const [fettMattisEntry] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(fettmattis)
    .where(isNull(fettmattis.revokedAt));

  const [playersEntry] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(players)
    .where(eq(players.active, true));

  return {
    totalRounds: roundsEntry?.count ?? 0,
    fettMattisMoments: fettMattisEntry?.count ?? 0,
    activePlayers: playersEntry?.count ?? 0,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}
