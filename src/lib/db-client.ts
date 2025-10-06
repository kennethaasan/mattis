import { db } from "./db";
import { players } from "./db/schema";

export type InsertPlayerInput = {
  displayName: string;
  userId: string;
};

export type InsertPlayerResult = {
  id: string;
  display_name: string;
  active: boolean;
};

/**
 * Insert a player row and return the inserted row or null when none returned.
 * Performs minimal runtime validation to ensure the returned shape is correct.
 */
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

  const row = result[0] as unknown;

  if (
    typeof row !== "object" ||
    row === null ||
    typeof (row as any).id !== "string" ||
    typeof (row as any).display_name !== "string" ||
    typeof (row as any).active !== "boolean"
  ) {
    throw new Error("insertPlayer: returned row has unexpected shape");
  }

  return row as InsertPlayerResult;
}
