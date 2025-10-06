
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
