import { relations } from "drizzle-orm";
import {
  boolean,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";

const getId = () =>
  text()
    .primaryKey()
    .$defaultFn(() => v7());

const getOptionalTimestamp = () => timestamp({ withTimezone: true });
const getTimestamp = () => getOptionalTimestamp().notNull();

const getTimestamps = () => ({
  createdAt: getTimestamp().defaultNow(),
  updatedAt: getTimestamp()
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
  displayName: text().notNull().unique(),
  userId: text().references(() => users.id),
  active: boolean().default(true).notNull(),
  ...getTimestamps(),
});

export const rounds = pgTable("rounds", {
  id: getId(),
  createdBy: text()
    .references(() => users.id)
    .notNull(),
  createdAt: getTimestamp().defaultNow(),
  deletedAt: getOptionalTimestamp(),
});

export const roundParticipants = pgTable(
  "round_participants",
  {
    roundId: text()
      .references(() => rounds.id)
      .notNull(),
    playerId: text()
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
  roundId: text()
    .primaryKey()
    .references(() => rounds.id)
    .notNull(),
  loserId: text()
    .references(() => players.id)
    .notNull(),
});

export const fettmattis = pgTable("fettmattis", {
  id: getId(),
  playerId: text()
    .references(() => players.id)
    .notNull(),
  createdBy: text()
    .references(() => users.id)
    .notNull(),
  createdAt: getTimestamp().defaultNow(),
  revokedAt: getOptionalTimestamp(),
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
