import { relations } from "drizzle-orm";
import {
  boolean,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const players = pgTable("players", {
  id: uuid("id").primaryKey().defaultRandom(),
  displayName: text("display_name").notNull().unique(),
  userId: uuid("user_id").references(() => users.id),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const rounds = pgTable("rounds", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdBy: uuid("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const roundParticipants = pgTable(
  "round_participants",
  {
    roundId: uuid("round_id")
      .references(() => rounds.id)
      .notNull(),
    playerId: uuid("player_id")
      .references(() => players.id)
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.roundId, table.playerId],
      name: "round_participants_pk",
    }),
  ],
);

export const roundLoser = pgTable("round_loser", {
  roundId: uuid("round_id")
    .primaryKey()
    .references(() => rounds.id)
    .notNull(),
  loserId: uuid("loser_id")
    .references(() => players.id)
    .notNull(),
});

export const fettmattis = pgTable("fettmattis", {
  id: uuid("id").primaryKey().defaultRandom(),
  playerId: uuid("player_id")
    .references(() => players.id)
    .notNull(),
  roundId: uuid("round_id").references(() => rounds.id),
  createdBy: uuid("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

// Relations

export const usersRelations = relations(users, ({ one }) => ({
  player: one(players, {
    fields: [users.id],
    references: [players.userId],
  }),
}));

export const playersRelations = relations(players, ({ one }) => ({
  user: one(users, {
    fields: [players.userId],
    references: [users.id],
  }),
}));

export const roundsRelations = relations(rounds, ({ many, one }) => ({
  participants: many(roundParticipants),
  loser: one(roundLoser, {
    fields: [rounds.id],
    references: [roundLoser.roundId],
  }),
}));

export const roundParticipantsRelations = relations(
  roundParticipants,
  ({ one }) => ({
    round: one(rounds, {
      fields: [roundParticipants.roundId],
      references: [rounds.id],
    }),
    player: one(players, {
      fields: [roundParticipants.playerId],
      references: [players.id],
    }),
  }),
);

export const roundLoserRelations = relations(roundLoser, ({ one }) => ({
  round: one(rounds, {
    fields: [roundLoser.roundId],
    references: [rounds.id],
  }),
  loser: one(players, {
    fields: [roundLoser.loserId],
    references: [players.id],
  }),
}));

export const fettmattisRelations = relations(fettmattis, ({ one }) => ({
  player: one(players, {
    fields: [fettmattis.playerId],
    references: [players.id],
  }),
  round: one(rounds, {
    fields: [fettmattis.roundId],
    references: [rounds.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Round = typeof rounds.$inferSelect;
export type FettMattis = typeof fettmattis.$inferSelect;
