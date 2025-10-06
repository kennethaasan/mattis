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

  const candidate = result[0];

  if (typeof candidate !== "object" || candidate === null) {
    throw new Error("insertPlayer: returned row is not an object");
  }

  const maybeId = (candidate as Record<string, unknown>)["id"];
  const maybeDisplayName = (candidate as Record<string, unknown>)["display_name"];
  const maybeActive = (candidate as Record<string, unknown>)["active"];

  if (typeof maybeId !== "string" || typeof maybeDisplayName !== "string" || typeof maybeActive !== "boolean") {
    throw new Error("insertPlayer: returned row has unexpected shape");
  }

  return {
    id: maybeId,
    display_name: maybeDisplayName,
    active: maybeActive,
  } as InsertPlayerResult;
}
