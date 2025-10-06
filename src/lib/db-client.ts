import { eq, sql } from "drizzle-orm";

import { db } from "./db";
import { fettmattis,players, roundParticipants, rounds } from "./db/schema";

export type InsertPlayerInput = {
  displayName: string;
  userId: string;
};

export type InsertPlayerResult = {
  id: string;
  display_name: string;
  active: boolean;
};

export async function insertPlayer(input: InsertPlayerInput): Promise<InsertPlayerResult | null> {
  if (!input || typeof input !== "object") {
    throw new Error("insertPlayer: input must be an object");
  }
  if (typeof input.displayName !== "string" || input.displayName.trim() === "") {
    throw new Error("insertPlayer: displayName must be a non-empty string");
  }
  if (typeof input.userId !== "string" || input.userId.trim() === "") {
    throw new Error("insertPlayer: userId must be a non-empty string");
  }

  const result = await db
    .insert(players)
    .values({ displayName: input.displayName, userId: input.userId })
    .returning({
      id: players.id,
      display_name: players.displayName,
      active: players.active,
    });

  if (!Array.isArray(result) || result.length === 0) {
    return null;
  }

  const candidate = result[0] as Record<string, unknown>;
  const maybeId = candidate["id"];
  const maybeDisplayName = candidate["display_name"];
  const maybeActive = candidate["active"];

  if (typeof maybeId !== "string" || typeof maybeDisplayName !== "string" || typeof maybeActive !== "boolean") {
    throw new Error("insertPlayer: returned row has unexpected shape");
  }

  return {
    id: maybeId,
    display_name: maybeDisplayName,
    active: maybeActive,
  } as InsertPlayerResult;
}

export type InsertRoundInput = {
  createdBy: string;
  participantIds: string[];
  loserId: string;
};

export async function insertRound(input: InsertRoundInput): Promise<{ id: string } | null> {
  if (!input || typeof input !== "object") {
    throw new Error("insertRound: input must be an object");
  }
  if (typeof input.createdBy !== "string" || input.createdBy.trim() === "") {
    throw new Error("insertRound: createdBy must be a non-empty string");
  }
  if (!Array.isArray(input.participantIds) || input.participantIds.length < 2) {
    throw new Error("insertRound: participantIds must be an array with at least two ids");
  }
  if (typeof input.loserId !== "string" || input.loserId.trim() === "") {
    throw new Error("insertRound: loserId must be a non-empty string");
  }
  if (!input.participantIds.includes(input.loserId)) {
    throw new Error("insertRound: loserId must be one of participantIds");
  }

  const roundResult = await db
    .insert(rounds)
    .values({ createdBy: input.createdBy, loserId: input.loserId })
    .returning({ id: rounds.id });

  if (!Array.isArray(roundResult) || roundResult.length === 0) {
    return null;
  }

  const roundId = (roundResult[0] as Record<string, unknown>)["id"] as string;

  const participantValues = input.participantIds.map((pid) => ({ roundId, playerId: pid }));
  await db.insert(roundParticipants).values(participantValues);

  return { id: roundId };
}

export async function insertFettMattis(input: { playerId: string; roundId?: string; createdBy: string }): Promise<{ id: string } | null> {
  if (!input || typeof input !== "object") {
    throw new Error("insertFettMattis: input must be an object");
  }
  if (typeof input.playerId !== "string" || input.playerId.trim() === "") {
    throw new Error("insertFettMattis: playerId must be a non-empty string");
  }
  if (typeof input.createdBy !== "string" || input.createdBy.trim() === "") {
    throw new Error("insertFettMattis: createdBy must be a non-empty string");
  }

  const result = await db
    .insert(fettmattis)
    .values({ playerId: input.playerId, roundId: input.roundId ?? undefined, createdBy: input.createdBy })
    .returning({ id: fettmattis.id });

  if (!Array.isArray(result) || result.length === 0) {
    return null;
  }

  const id = (result[0] as Record<string, unknown>)["id"] as string;
  return { id };
}

export async function queryLeaderboard(query: { year?: number } = {}): Promise<Array<{ player_id: string; display_name: string; score: number }>> {
  const startEnd = typeof query.year === "number"
    ? { start: new Date(query.year, 0, 1), end: new Date(query.year + 1, 0, 1) }
    : undefined;

  const scoreExpr = sql<number>`COALESCE(count(${fettmattis.id}), 0)`;

  const whereConditions = startEnd
    ? sql`${fettmattis.createdAt} >= ${startEnd.start} AND ${fettmattis.createdAt} < ${startEnd.end}`
    : undefined;

  const rows = await db
    .select({ player_id: players.id, display_name: players.displayName, score: scoreExpr })
    .from(players)
    .leftJoin(fettmattis, eq(players.id, fettmattis.playerId))
    .where(whereConditions ?? undefined)
    .groupBy(players.id, players.displayName)
    .orderBy(sql`${scoreExpr} DESC, ${players.displayName} ASC`);

  function ensureRecord(x: unknown): asserts x is Record<string, unknown> {
    if (typeof x !== "object" || x === null) throw new Error("queryLeaderboard: unexpected row type");
  }

  return rows.map((r) => {
    ensureRecord(r);
    const playerId = r["player_id"];
    const displayName = r["display_name"];
    const scoreVal = r["score"];

    if (typeof playerId !== "string" && typeof playerId !== "number") {
      throw new Error("queryLeaderboard: invalid player_id in row");
    }
    if (typeof displayName !== "string") {
      throw new Error("queryLeaderboard: invalid display_name in row");
    }

    const score = typeof scoreVal === "number" ? scoreVal : Number(scoreVal);
    if (Number.isNaN(score)) throw new Error("queryLeaderboard: invalid score in row");

    return { player_id: String(playerId), display_name: displayName, score };
  });
}

export async function listPlayers(): Promise<Array<InsertPlayerResult>> {
  const rows = await db
    .select({ id: players.id, display_name: players.displayName, active: players.active })
    .from(players)
    .where(eq(players.active, true))
    .orderBy(sql`${players.displayName} ASC`);

  function ensureRecord(x: unknown): asserts x is Record<string, unknown> {
    if (typeof x !== "object" || x === null) throw new Error("listPlayers: unexpected row type");
  }

  return rows.map((r) => {
    ensureRecord(r);
    const idVal = r["id"];
    const displayNameVal = r["display_name"];
    const activeVal = r["active"];

    if (typeof idVal !== "string" && typeof idVal !== "number") {
      throw new Error("listPlayers: invalid id in row");
    }
    if (typeof displayNameVal !== "string") {
      throw new Error("listPlayers: invalid display_name in row");
    }
    if (typeof activeVal !== "boolean") {
      throw new Error("listPlayers: invalid active flag in row");
    }

    return { id: String(idVal), display_name: displayNameVal, active: activeVal };
  });
}

export async function getPlayerById(id: string): Promise<InsertPlayerResult | null> {
  if (typeof id !== "string" || id.trim() === "") {
    throw new Error("getPlayerById: id must be a non-empty string");
  }

  const rows = await db
    .select({ id: players.id, display_name: players.displayName, active: players.active })
    .from(players)
    .where(eq(players.id, id));

  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  const r = rows[0] as Record<string, unknown>;
  const idVal = r["id"];
  const displayNameVal = r["display_name"];
  const activeVal = r["active"];

  if (typeof idVal !== "string" && typeof idVal !== "number") {
    throw new Error("getPlayerById: invalid id in row");
  }
  if (typeof displayNameVal !== "string") {
    throw new Error("getPlayerById: invalid display_name in row");
  }
  if (typeof activeVal !== "boolean") {
    throw new Error("getPlayerById: invalid active flag in row");
  }

  return { id: String(idVal), display_name: displayNameVal, active: activeVal };
}

