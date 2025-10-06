// Placeholder for T017: Define the Drizzle ORM schema
import { boolean, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

// Users table (for authentication)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 256 }).unique().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Players table (for game participants)
export const players = pgTable("players", {
  id: uuid("id").primaryKey().defaultRandom(),
  displayName: varchar("display_name", { length: 256 }).unique().notNull(),
  userId: uuid("user_id").references(() => users.id).unique(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Rounds table
export const rounds = pgTable("rounds", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  loserId: uuid("loser_id").references(() => players.id).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// Round participants - many-to-many between rounds and players
export const roundParticipants = pgTable("round_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  roundId: uuid("round_id").references(() => rounds.id).notNull(),
  playerId: uuid("player_id").references(() => players.id).notNull(),
});

// FettMattis table (records special events/points awarded to a player)
export const fettmattis = pgTable("fettmattis", {
  id: uuid("id").primaryKey().defaultRandom(),
  playerId: uuid("player_id").references(() => players.id).notNull(),
  roundId: uuid("round_id").references(() => rounds.id),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

