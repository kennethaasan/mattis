import { eq } from "drizzle-orm";
import { expect, test } from "vitest";
import { env } from "@/env";
import { db } from "@/lib/db/db";
import { fettmattis as fettMattisTable, rounds } from "@/lib/db/schema";
import { generateId } from "@/lib/utils/id";

const {
  createPlayer,
  createRound,
  createFettMattis,
  getRegularLeaderboard,
  getFettMattisLeaderboard,
} = await import("@/lib/db-client");

test("T016: recording a round updates the regular and FettMattis leaderboards", async () => {
  const userId = env.BASIC_AUTH_USER_ID;

  const [ola, kari] = await Promise.all([
    createPlayer({ id: generateId(), displayName: "Ola" }),
    createPlayer({ id: generateId(), displayName: "Kari" }),
  ]);

  await createRound({
    participantIds: [ola.id, kari.id],
    loserId: kari.id,
    createdBy: userId,
  });

  const regularLeaderboard = await getRegularLeaderboard(
    new Date().getFullYear(),
  );

  expect(regularLeaderboard).toHaveLength(2);
  expect(regularLeaderboard[0]).toMatchObject({
    rank: 1,
    player: { displayName: "Kari" },
    lossCount: 1,
  });
  expect(regularLeaderboard[1]).toMatchObject({
    rank: 2,
    player: { displayName: "Ola" },
    lossCount: 0,
  });

  await createFettMattis({
    playerId: kari.id,
    createdBy: userId,
  });

  const fettMattisLeaderboard = await getFettMattisLeaderboard(
    new Date().getFullYear(),
  );

  expect(fettMattisLeaderboard).toHaveLength(1);
  expect(fettMattisLeaderboard[0]).toMatchObject({
    rank: 1,
    player: { displayName: "Kari" },
    fettMattisCount: 1,
  });
});

test("T068: all-time leaderboards aggregate results across seasons", async () => {
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const [ada, ben] = await Promise.all([
    createPlayer({ id: generateId(), displayName: "Ada" }),
    createPlayer({ id: generateId(), displayName: "Ben" }),
  ]);

  await createRound({
    participantIds: [ada.id, ben.id],
    loserId: ada.id,
    createdBy: env.BASIC_AUTH_USER_ID,
  });

  const pastRound = await createRound({
    participantIds: [ada.id, ben.id],
    loserId: ada.id,
    createdBy: env.BASIC_AUTH_USER_ID,
  });

  await db
    .update(rounds)
    .set({ createdAt: new Date(Date.UTC(previousYear, 5, 1, 12)) })
    .where(eq(rounds.id, pastRound.id));

  await createFettMattis({
    playerId: ada.id,
    createdBy: env.BASIC_AUTH_USER_ID,
  });

  const historicalFettMattis = await createFettMattis({
    playerId: ada.id,
    createdBy: env.BASIC_AUTH_USER_ID,
  });

  await db
    .update(fettMattisTable)
    .set({ createdAt: new Date(Date.UTC(previousYear, 2, 14, 8)) })
    .where(eq(fettMattisTable.id, historicalFettMattis.id));

  const currentRegularLeaderboard = await getRegularLeaderboard(currentYear);

  expect(currentRegularLeaderboard).toHaveLength(4);
  const adaCurrent = currentRegularLeaderboard.find(
    (entry) => entry.player.displayName === "Ada",
  );
  const benCurrent = currentRegularLeaderboard.find(
    (entry) => entry.player.displayName === "Ben",
  );
  const adaCurrentEntry = expectDefined(
    adaCurrent,
    "Expected Ada to appear in the current year leaderboard.",
  );
  const benCurrentEntry = expectDefined(
    benCurrent,
    "Expected Ben to appear in the current year leaderboard.",
  );

  expect(adaCurrentEntry).toMatchObject({
    participationCount: 1,
    lossCount: 1,
    rank: 1,
  });
  expect(benCurrentEntry).toMatchObject({
    participationCount: 1,
    lossCount: 0,
    rank: 3,
  });

  const allTimeRegularLeaderboard = await getRegularLeaderboard(null);
  expect(allTimeRegularLeaderboard).toHaveLength(4);

  const topAllTimeEntry = expectDefined(
    allTimeRegularLeaderboard[0],
    "Expected an entry in the all-time regular leaderboard.",
  );

  expect(topAllTimeEntry).toMatchObject({
    player: { displayName: "Ada" },
    participationCount: 2,
    lossCount: 2,
  });
  expect(topAllTimeEntry.lossPercentage).toBeCloseTo(100);

  const currentFettMattisLeaderboard =
    await getFettMattisLeaderboard(currentYear);
  expect(currentFettMattisLeaderboard).toHaveLength(2);

  const currentFettMattisLeader = expectDefined(
    currentFettMattisLeaderboard[0],
    "Expected Ada to lead the current year FettMattis leaderboard.",
  );

  expect(currentFettMattisLeader).toMatchObject({
    player: { displayName: "Ada" },
    fettMattisCount: 1,
    rank: 1,
  });

  const allTimeFettMattisLeaderboard = await getFettMattisLeaderboard(null);
  expect(allTimeFettMattisLeaderboard).toHaveLength(2);

  const allTimeFettMattisLeader = expectDefined(
    allTimeFettMattisLeaderboard[0],
    "Expected Ada to lead the all-time FettMattis leaderboard.",
  );

  expect(allTimeFettMattisLeader).toMatchObject({
    player: { displayName: "Ada" },
    fettMattisCount: 2,
    rank: 1,
  });
});

function expectDefined<T>(value: T | null | undefined, message: string): T {
  if (value === null || typeof value === "undefined") {
    throw new Error(message);
  }

  expect(value).toBeDefined();
  return value;
}
