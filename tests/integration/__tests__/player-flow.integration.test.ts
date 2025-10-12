import { expect, test } from "vitest";
import { createPlayer, listPlayers } from "@/lib/db-client";

test("T015: creating a player surfaces it in the list of players", async () => {
  const created = await createPlayer({ displayName: "Saga" });

  const players = await listPlayers();
  expect(players).toHaveLength(1);
  expect(players[0]).toMatchObject({
    id: created.id,
    displayName: "Saga",
    active: true,
  });
});
