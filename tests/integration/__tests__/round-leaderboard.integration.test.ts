import { randomUUID } from "node:crypto";

import { afterAll, beforeEach, expect, test, vi } from "vitest";

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
    player: { displayName: "Lina" },
    lossCount: 0,
  });
  expect(regularLeaderboard[1]).toMatchObject({
    rank: 2,
    player: { displayName: "Rex" },
    lossCount: 0,
  });
  expect(regularLeaderboard[2]).toMatchObject({
    rank: 3,
    player: { displayName: "Omar" },
    lossCount: 1,
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
