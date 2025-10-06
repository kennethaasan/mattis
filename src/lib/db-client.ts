import { eq } from "drizzle-orm";

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

  const whereClause = startEnd
    ? fettmattis.createdAt.gte(startEnd.start).and(fettmattis.createdAt.lt(startEnd.end))
    : undefined;

  const rows = await db
    .select({ player_id: players.id, display_name: players.displayName, score: db.raw<number>("COALESCE(count(fettmattis.id), 0)") })
    .from(players)
    .leftJoin(fettmattis, eq(players.id, fettmattis.playerId))
    .where(whereClause ?? undefined)
    .groupBy(players.id, players.displayName)
    .orderBy(db.raw("score DESC, display_name ASC"));

  return rows.map((r: any) => ({ player_id: String(r.player_id), display_name: String(r.display_name), score: Number(r.score) }));
}
