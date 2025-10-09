import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { afterAll, beforeEach, expect, test, vi } from "vitest";

import { fettmattis as fettMattisTable, rounds } from "@/lib/db/schema";
import { createTestDatabase } from "../../utils/test-db";

const testDatabase = await createTestDatabase();

vi.mock("@/lib/db", () => ({
  db: testDatabase.db,
}));

const {
  createPlayer,
  createRound,
  createFettMattis,
  getRegularLeaderboard,
  getFettMattisLeaderboard,
} = await import("@/lib/db-client");

beforeEach(async () => {
  await testDatabase.reset();
});

afterAll(async () => {
  await testDatabase.close();
});

test("T016: recording a round updates the regular and FettMattis leaderboards", async () => {
  const userId = "00000000-0000-7000-0000-000000000099";

  const [lina, omar, rex] = await Promise.all([
    createPlayer({ id: randomUUID(), displayName: "Lina" }),
    createPlayer({ id: randomUUID(), displayName: "Omar" }),
    createPlayer({ id: randomUUID(), displayName: "Rex" }),
  ]);

  const round = await createRound({
    participantIds: [lina.id, omar.id, rex.id],
    loserId: omar.id,
    createdBy: userId,
  });

  const regularLeaderboard = await getRegularLeaderboard(new Date().getFullYear());

  expect(regularLeaderboard).toHaveLength(3);
  expect(regularLeaderboard[0]).toMatchObject({
    rank: 1,
    player: { displayName: "Omar" },
    lossCount: 1,
  });
  expect(regularLeaderboard[1]).toMatchObject({
    rank: 2,
    player: { displayName: "Lina" },
    lossCount: 0,
  });
  expect(regularLeaderboard[2]).toMatchObject({
    rank: 3,
    player: { displayName: "Rex" },
    lossCount: 0,
  });

  await createFettMattis({
    playerId: lina.id,
    roundId: round.id,
    createdBy: userId,
  });

  const fettMattisLeaderboard = await getFettMattisLeaderboard(new Date().getFullYear());

  expect(fettMattisLeaderboard).toHaveLength(1);
  expect(fettMattisLeaderboard[0]).toMatchObject({
    rank: 1,
    player: { displayName: "Lina" },
    fettMattisCount: 1,
  });
});

test("T068: all-time leaderboards aggregate results across seasons", async () => {
  const userId = "00000000-0000-7000-0000-000000000111";
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const [ada, ben] = await Promise.all([
    createPlayer({ id: randomUUID(), displayName: "Ada" }),
    createPlayer({ id: randomUUID(), displayName: "Ben" }),
  ]);

  const currentRound = await createRound({
    participantIds: [ada.id, ben.id],
    loserId: ada.id,
    createdBy: userId,
  });

  const pastRound = await createRound({
    participantIds: [ada.id, ben.id],
    loserId: ada.id,
    createdBy: userId,
  });

  await testDatabase.db
    .update(rounds)
    .set({ createdAt: new Date(Date.UTC(previousYear, 5, 1, 12)) })
    .where(eq(rounds.id, pastRound.id));

  await createFettMattis({
    playerId: ada.id,
    roundId: currentRound.id,
    createdBy: userId,
  });

  const historicalFettMattis = await createFettMattis({
    playerId: ada.id,
    roundId: pastRound.id,
    createdBy: userId,
  });

  await testDatabase.db
    .update(fettMattisTable)
    .set({ createdAt: new Date(Date.UTC(previousYear, 2, 14, 8)) })
    .where(eq(fettMattisTable.id, historicalFettMattis.id));

  const currentRegularLeaderboard = await getRegularLeaderboard(currentYear);

  expect(currentRegularLeaderboard).toHaveLength(2);
  const adaCurrent = currentRegularLeaderboard.find((entry) => entry.player.displayName === "Ada");
  const benCurrent = currentRegularLeaderboard.find((entry) => entry.player.displayName === "Ben");
  expect(adaCurrent).toBeDefined();
  expect(benCurrent).toBeDefined();

  const adaCurrentEntry = adaCurrent!;
  const benCurrentEntry = benCurrent!;

  expect(adaCurrentEntry).toMatchObject({
    participationCount: 1,
    lossCount: 1,
    rank: 1,
  });
  expect(benCurrentEntry).toMatchObject({
    participationCount: 1,
    lossCount: 0,
    rank: 2,
  });

  const allTimeRegularLeaderboard = await getRegularLeaderboard(null);
  expect(allTimeRegularLeaderboard).toHaveLength(2);

  const topAllTimeEntry = allTimeRegularLeaderboard[0]!;

  expect(topAllTimeEntry).toMatchObject({
    player: { displayName: "Ada" },
    participationCount: 2,
    lossCount: 2,
  });
  expect(topAllTimeEntry.lossPercentage).toBeCloseTo(100);

  const currentFettMattisLeaderboard = await getFettMattisLeaderboard(currentYear);
  expect(currentFettMattisLeaderboard).toHaveLength(1);

  const currentFettMattisLeader = currentFettMattisLeaderboard[0]!;

  expect(currentFettMattisLeader).toMatchObject({
    player: { displayName: "Ada" },
    fettMattisCount: 1,
    rank: 1,
  });

  const allTimeFettMattisLeaderboard = await getFettMattisLeaderboard(null);
  expect(allTimeFettMattisLeaderboard).toHaveLength(1);

  const allTimeFettMattisLeader = allTimeFettMattisLeaderboard[0]!;

  expect(allTimeFettMattisLeader).toMatchObject({
    player: { displayName: "Ada" },
    fettMattisCount: 2,
    rank: 1,
  });
});
