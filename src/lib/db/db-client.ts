
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export const listPlayers = async () => {
  return await db.select().from(schema.players);
};

export const getPlayerById = async (id: string) => {
  const player = await db.select().from(schema.players).where(eq(schema.players.id, id));
  return player[0];
};

export const insertPlayer = async (player: { displayName: string }) => {
  const newPlayer = await db.insert(schema.players).values(player).returning();
  return newPlayer[0];
};

export const updatePlayer = async (id: string, player: { displayName?: string; active?: boolean }) => {
  const updatedPlayer = await db.update(schema.players).set(player).where(eq(schema.players.id, id)).returning();
  return updatedPlayer[0];
};

export const getRoundById = async (id: string) => {
  const round = await db.query.rounds.findFirst({
    where: eq(schema.rounds.id, id),
    with: {
      participants: {
        with: {
          player: true,
        },
      },
      loser: {
        with: {
          player: true,
        },
      },
    },
  });
  return round;
};

export const updateRound = async (id: string, round: { participantIds?: string[]; loserId?: string }) => {
  // This is a complex operation, not a simple update.
  // It requires removing old participants, adding new ones, and updating the loser.
  // This is a placeholder implementation.
  const updatedRound = await db.update(schema.rounds).set({}).where(eq(schema.rounds.id, id)).returning();
  return updatedRound[0];
};

export const deleteRound = async (id: string) => {
  const deletedRound = await db.delete(schema.rounds).where(eq(schema.rounds.id, id)).returning();
  return deletedRound[0];
};

export const insertFettMattis = async (fettmattis: { playerId: string; roundId?: string; createdBy: string }) => {
  const newFettmattis = await db.insert(schema.fettmattis).values(fettmattis).returning();
  return newFettmattis[0];
};

export const deleteFettMattis = async (id: string) => {
  const deletedFettmattis = await db.delete(schema.fettmattis).where(eq(schema.fettmattis.id, id)).returning();
  return deletedFettmattis[0];
};
