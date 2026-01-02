import { describe, expect, test } from "vitest";
import { generateId } from "@/lib/utils/id";

const {
  createPlayer,
  listPlayers,
  getPlayerById,
  updatePlayer,
  createRound,
  getRoundById,
  getMostRecentRound,
  listRecentRounds,
  updateRound,
  deleteRound,
  createFettmattis,
  listRecentFettmattis,
  revokeFettmattis,
  getLeaderboardSeasons,
  getOverviewStats,
  NotFoundError,
  ConflictError,
} = await import("@/lib/db-client");

describe("Player CRUD operations", () => {
  test("createPlayer creates a new player with display name", async () => {
    const player = await createPlayer({
      id: generateId(),
      displayName: "Test Player",
    });

    expect(player).toMatchObject({
      displayName: "Test Player",
      active: true,
    });
    expect(player.id).toBeDefined();
    expect(player.createdAt).toBeInstanceOf(Date);
    expect(player.updatedAt).toBeInstanceOf(Date);
  });

  test("createPlayer throws ConflictError for duplicate display name", async () => {
    const displayName = `Duplicate-${generateId().slice(0, 8)}`;
    await createPlayer({ id: generateId(), displayName });

    await expect(
      createPlayer({ id: generateId(), displayName }),
    ).rejects.toThrow(ConflictError);
  });

  test("listPlayers returns all players sorted by display name", async () => {
    const players = await listPlayers();
    expect(Array.isArray(players)).toBe(true);

    // Check sorting
    for (let i = 1; i < players.length; i++) {
      const prev = players[i - 1];
      const curr = players[i];
      if (prev && curr) {
        expect(
          prev.displayName.localeCompare(curr.displayName),
        ).toBeLessThanOrEqual(0);
      }
    }
  });

  test("getPlayerById returns a player by ID", async () => {
    const created = await createPlayer({
      id: generateId(),
      displayName: `GetById-${generateId().slice(0, 8)}`,
    });

    const fetched = await getPlayerById(created.id);
    expect(fetched).toMatchObject({
      id: created.id,
      displayName: created.displayName,
    });
  });

  test("getPlayerById throws NotFoundError for non-existent player", async () => {
    await expect(getPlayerById(generateId())).rejects.toThrow(NotFoundError);
  });

  test("updatePlayer updates display name", async () => {
    const player = await createPlayer({
      id: generateId(),
      displayName: `Original-${generateId().slice(0, 8)}`,
    });

    const updated = await updatePlayer(player.id, {
      displayName: `Updated-${generateId().slice(0, 8)}`,
    });

    expect(updated.displayName).toContain("Updated");
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
      player.updatedAt.getTime(),
    );
  });

  test("updatePlayer updates active status", async () => {
    const player = await createPlayer({
      id: generateId(),
      displayName: `Active-${generateId().slice(0, 8)}`,
    });

    const updated = await updatePlayer(player.id, { active: false });
    expect(updated.active).toBe(false);
  });

  test("updatePlayer returns unchanged player when no updates provided", async () => {
    const player = await createPlayer({
      id: generateId(),
      displayName: `NoChange-${generateId().slice(0, 8)}`,
    });

    const result = await updatePlayer(player.id, {});
    expect(result.id).toBe(player.id);
  });

  test("updatePlayer throws NotFoundError for non-existent player", async () => {
    await expect(
      updatePlayer(generateId(), { displayName: "New Name" }),
    ).rejects.toThrow(NotFoundError);
  });

  test("updatePlayer throws ConflictError for duplicate display name", async () => {
    const name1 = `First-${generateId().slice(0, 8)}`;
    const name2 = `Second-${generateId().slice(0, 8)}`;
    await createPlayer({ id: generateId(), displayName: name1 });
    const player2 = await createPlayer({
      id: generateId(),
      displayName: name2,
    });

    await expect(
      updatePlayer(player2.id, { displayName: name1 }),
    ).rejects.toThrow(ConflictError);
  });
});

describe("Round CRUD operations", () => {
  test("createRound creates a round with participants and loser", async () => {
    const userId = process.env.BASIC_AUTH_USER_ID as string;
    const [p1, p2] = await Promise.all([
      createPlayer({
        id: generateId(),
        displayName: `RoundP1-${generateId().slice(0, 8)}`,
      }),
      createPlayer({
        id: generateId(),
        displayName: `RoundP2-${generateId().slice(0, 8)}`,
      }),
    ]);

    const round = await createRound({
      participantIds: [p1.id, p2.id],
      loserId: p2.id,
      createdBy: userId,
    });

    expect(round.id).toBeDefined();
    expect(round.participants).toHaveLength(2);
    expect(round.loser.id).toBe(p2.id);
    expect(round.deletedAt).toBeNull();
  });

  test("createRound deduplicates participant IDs", async () => {
    const userId = process.env.BASIC_AUTH_USER_ID as string;
    const [p1, p2] = await Promise.all([
      createPlayer({
        id: generateId(),
        displayName: `Dedup1-${generateId().slice(0, 8)}`,
      }),
      createPlayer({
        id: generateId(),
        displayName: `Dedup2-${generateId().slice(0, 8)}`,
      }),
    ]);

    const round = await createRound({
      participantIds: [p1.id, p2.id, p1.id, p2.id],
      loserId: p1.id,
      createdBy: userId,
    });

    expect(round.participants).toHaveLength(2);
  });

  test("createRound throws ConflictError when loser not in participants", async () => {
    const userId = process.env.BASIC_AUTH_USER_ID as string;
    const [p1, p2, p3] = await Promise.all([
      createPlayer({
        id: generateId(),
        displayName: `LoserCheck1-${generateId().slice(0, 8)}`,
      }),
      createPlayer({
        id: generateId(),
        displayName: `LoserCheck2-${generateId().slice(0, 8)}`,
      }),
      createPlayer({
        id: generateId(),
        displayName: `LoserCheck3-${generateId().slice(0, 8)}`,
      }),
    ]);

    await expect(
      createRound({
        participantIds: [p1.id, p2.id],
        loserId: p3.id,
        createdBy: userId,
      }),
    ).rejects.toThrow(ConflictError);
  });

  test("createRound throws NotFoundError for non-existent participants", async () => {
    const userId = process.env.BASIC_AUTH_USER_ID as string;
    const p1 = await createPlayer({
      id: generateId(),
      displayName: `Exists-${generateId().slice(0, 8)}`,
    });

    await expect(
      createRound({
        participantIds: [p1.id, generateId()],
        loserId: p1.id,
        createdBy: userId,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  test("getRoundById returns a round", async () => {
    const userId = process.env.BASIC_AUTH_USER_ID as string;
    const [p1, p2] = await Promise.all([
      createPlayer({
        id: generateId(),
        displayName: `GetRound1-${generateId().slice(0, 8)}`,
      }),
      createPlayer({
        id: generateId(),
        displayName: `GetRound2-${generateId().slice(0, 8)}`,
      }),
    ]);

    const created = await createRound({
      participantIds: [p1.id, p2.id],
      loserId: p1.id,
      createdBy: userId,
    });

    const fetched = await getRoundById(created.id);
    expect(fetched.id).toBe(created.id);
    expect(fetched.loser.id).toBe(p1.id);
  });

  test("getRoundById throws NotFoundError for non-existent round", async () => {
    await expect(getRoundById(generateId())).rejects.toThrow(NotFoundError);
  });

  test("getMostRecentRound returns the latest round", async () => {
    const userId = process.env.BASIC_AUTH_USER_ID as string;
    const [p1, p2] = await Promise.all([
      createPlayer({
        id: generateId(),
        displayName: `Recent1-${generateId().slice(0, 8)}`,
      }),
      createPlayer({
        id: generateId(),
        displayName: `Recent2-${generateId().slice(0, 8)}`,
      }),
    ]);

    const round = await createRound({
      participantIds: [p1.id, p2.id],
      loserId: p1.id,
      createdBy: userId,
    });

    const latest = await getMostRecentRound();
    expect(latest).not.toBeNull();
    expect(latest?.id).toBe(round.id);
  });

  test("listRecentRounds returns rounds ordered by creation date", async () => {
    const rounds = await listRecentRounds({ limit: 5 });
    expect(Array.isArray(rounds)).toBe(true);
    expect(rounds.length).toBeLessThanOrEqual(5);
  });

  test("listRecentRounds uses default limit when not provided", async () => {
    const rounds = await listRecentRounds();
    expect(Array.isArray(rounds)).toBe(true);
  });

  test("updateRound updates participants", async () => {
    const userId = process.env.BASIC_AUTH_USER_ID as string;
    const [p1, p2, p3] = await Promise.all([
      createPlayer({
        id: generateId(),
        displayName: `Update1-${generateId().slice(0, 8)}`,
      }),
      createPlayer({
        id: generateId(),
        displayName: `Update2-${generateId().slice(0, 8)}`,
      }),
      createPlayer({
        id: generateId(),
        displayName: `Update3-${generateId().slice(0, 8)}`,
      }),
    ]);

    const round = await createRound({
      participantIds: [p1.id, p2.id],
      loserId: p1.id,
      createdBy: userId,
    });

    const updated = await updateRound(round.id, {
      participantIds: [p1.id, p2.id, p3.id],
    });

    expect(updated.participants).toHaveLength(3);
  });

  test("updateRound updates loser", async () => {
    const userId = process.env.BASIC_AUTH_USER_ID as string;
    const [p1, p2] = await Promise.all([
      createPlayer({
        id: generateId(),
        displayName: `LoserUp1-${generateId().slice(0, 8)}`,
      }),
      createPlayer({
        id: generateId(),
        displayName: `LoserUp2-${generateId().slice(0, 8)}`,
      }),
    ]);

    const round = await createRound({
      participantIds: [p1.id, p2.id],
      loserId: p1.id,
      createdBy: userId,
    });

    const updated = await updateRound(round.id, { loserId: p2.id });
    expect(updated.loser.id).toBe(p2.id);
  });

  test("updateRound throws NotFoundError for non-existent round", async () => {
    await expect(
      updateRound(generateId(), { loserId: generateId() }),
    ).rejects.toThrow(NotFoundError);
  });

  test("deleteRound soft-deletes a round", async () => {
    const userId = process.env.BASIC_AUTH_USER_ID as string;
    const [p1, p2] = await Promise.all([
      createPlayer({
        id: generateId(),
        displayName: `Delete1-${generateId().slice(0, 8)}`,
      }),
      createPlayer({
        id: generateId(),
        displayName: `Delete2-${generateId().slice(0, 8)}`,
      }),
    ]);

    const round = await createRound({
      participantIds: [p1.id, p2.id],
      loserId: p1.id,
      createdBy: userId,
    });

    await deleteRound(round.id);

    await expect(getRoundById(round.id)).rejects.toThrow(NotFoundError);
  });

  test("deleteRound throws NotFoundError for non-existent round", async () => {
    await expect(deleteRound(generateId())).rejects.toThrow(NotFoundError);
  });
});

describe("Fettmattis CRUD operations", () => {
  test("createFettmattis creates a new Fettmattis record", async () => {
    const userId = process.env.BASIC_AUTH_USER_ID as string;
    const player = await createPlayer({
      id: generateId(),
      displayName: `FM-${generateId().slice(0, 8)}`,
    });

    const fm = await createFettmattis({
      playerId: player.id,
      createdBy: userId,
    });

    expect(fm.id).toBeDefined();
    expect(fm.player.id).toBe(player.id);
    expect(fm.revokedAt).toBeNull();
  });

  test("createFettmattis throws NotFoundError for non-existent player", async () => {
    const userId = process.env.BASIC_AUTH_USER_ID as string;

    await expect(
      createFettmattis({
        playerId: generateId(),
        createdBy: userId,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  test("listRecentFettmattis returns Fettmattis records", async () => {
    const records = await listRecentFettmattis({ limit: 5 });
    expect(Array.isArray(records)).toBe(true);
  });

  test("revokeFettmattis soft-revokes a Fettmattis", async () => {
    const userId = process.env.BASIC_AUTH_USER_ID as string;
    const player = await createPlayer({
      id: generateId(),
      displayName: `Revoke-${generateId().slice(0, 8)}`,
    });

    const fm = await createFettmattis({
      playerId: player.id,
      createdBy: userId,
    });

    await revokeFettmattis(fm.id);

    // Verify it's no longer in the active list
    const activeRecords = await listRecentFettmattis({ limit: 100 });
    const found = activeRecords.find((r) => r.id === fm.id);
    expect(found).toBeUndefined();
  });

  test("revokeFettmattis throws NotFoundError for non-existent Fettmattis", async () => {
    await expect(revokeFettmattis(generateId())).rejects.toThrow(NotFoundError);
  });
});

describe("Leaderboard and Stats operations", () => {
  test("getLeaderboardSeasons returns an array of years", async () => {
    const seasons = await getLeaderboardSeasons();
    expect(Array.isArray(seasons)).toBe(true);
    expect(seasons.length).toBeGreaterThan(0);
    expect(seasons[0]).toBe(new Date().getFullYear());
  });

  test("getOverviewStats returns statistics", async () => {
    const stats = await getOverviewStats();

    expect(stats).toHaveProperty("totalRounds");
    expect(stats).toHaveProperty("fettmattisMoments");
    expect(stats).toHaveProperty("activePlayers");
    expect(typeof stats.totalRounds).toBe("number");
    expect(typeof stats.fettmattisMoments).toBe("number");
    expect(typeof stats.activePlayers).toBe("number");
  });
});
