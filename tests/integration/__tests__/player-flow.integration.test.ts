import { randomUUID } from "node:crypto";

import { afterAll, beforeEach, expect, test, vi } from "vitest";

import { createTestDatabase } from "../../utils/test-db";

const testDatabase = await createTestDatabase();

vi.mock("@/lib/db", () => ({
  db: testDatabase.db,
}));

const { createPlayer, listPlayers } = await import("@/lib/db-client");

beforeEach(async () => {
  await testDatabase.reset();
});

afterAll(async () => {
  await testDatabase.close();
});

test("T015: creating a player surfaces it in the list of players", async () => {
  const created = await createPlayer({ id: randomUUID(), displayName: "Saga" });

  const players = await listPlayers();
  expect(players).toHaveLength(1);
  expect(players[0]).toMatchObject({
    id: created.id,
    displayName: "Saga",
    active: true,
  });
});
