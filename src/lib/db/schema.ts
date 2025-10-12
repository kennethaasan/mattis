import { relations } from "drizzle-orm";
import {
  boolean,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";

/*
  Because we want to use snake_case casing in the database, and it's not supported with
  pushSchema that we use for tests, we need to define the column names explicitly here.
  See:
    - https://github.com/drizzle-team/drizzle-orm/issues/3913
    - https://github.com/drizzle-team/drizzle-orm/pull/3831
*/

const getId = () =>
  text()
    .primaryKey()
    .$defaultFn(() => v7());

const getOptionalTimestamp = (name: string) =>
  timestamp(name, { withTimezone: true });
const getTimestamp = (name: string) => getOptionalTimestamp(name).notNull();

const getTimestamps = () => ({
  createdAt: getTimestamp("created_at").defaultNow(),
  updatedAt: getTimestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const users = pgTable("users", {
  id: getId(),
  username: text().notNull().unique(),
  ...getTimestamps(),
});

export const players = pgTable("players", {
  id: getId(),
  displayName: text("display_name").notNull().unique(),
  userId: text("user_id").references(() => users.id),
  active: boolean().default(true).notNull(),
  ...getTimestamps(),
});

export const rounds = pgTable("rounds", {
  id: getId(),
  createdBy: text("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: getTimestamp("created_at").defaultNow(),
  deletedAt: getOptionalTimestamp("deleted_at"),
});

export const roundParticipants = pgTable(
  "round_participants",
  {
    roundId: text("round_id")
      .references(() => rounds.id)
      .notNull(),
    playerId: text("player_id")
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
  roundId: text("round_id")
    .primaryKey()
    .references(() => rounds.id)
    .notNull(),
  loserId: text("loser_id")
    .references(() => players.id)
    .notNull(),
});

export const fettmattis = pgTable("fettmattis", {
  id: getId(),
  playerId: text("player_id")
    .references(() => players.id)
    .notNull(),
  createdBy: text("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: getTimestamp("created_at").defaultNow(),
  revokedAt: getOptionalTimestamp("revoked_at"),
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
}));

export type User = typeof users.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Round = typeof rounds.$inferSelect;
export type FettMattis = typeof fettmattis.$inferSelect;
