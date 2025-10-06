import { test, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as createPlayer } from "@/app/api/players/route";
import { GET as listPlayers } from "@/app/api/players/route";
import { db } from "@/lib/db";
import { players } from "@/lib/db/schema";

// Set a dummy DATABASE_URL so the db client is initialized.


// Mock the environment variable for the user ID
const MOCK_USER_ID = "00000000-0000-7000-0000-000000000000";
vi.stubEnv("DEV_USER_ID", MOCK_USER_ID);

// Helper function to create a mock NextRequest
const createMockRequest = (body?: any) => {
  return {
    json: async () => body,
    headers: new Headers({ "X-User-Id": MOCK_USER_ID }),
  } as unknown as NextRequest;
};

beforeEach(async () => {
  // Truncate the players table before each test
  await db.delete(players);
});

test("T015: should be able to create a player and see them in the list", async () => {
  // 1. Create a new player
  const createPlayerRequest = createMockRequest({ display_name: "New Player" });
  const createPlayerResponse = await createPlayer(createPlayerRequest);
  expect(createPlayerResponse.status).toBe(201);
  const newPlayer = await createPlayerResponse.json();

  // 2. List all players
  const listPlayersRequest = createMockRequest();
  const listPlayersResponse = await listPlayers(listPlayersRequest);
  expect(listPlayersResponse.status).toBe(200);
  const playersList = await listPlayersResponse.json();

  // 3. Assert that the newly created player is in the list
  expect(playersList).toContainEqual(newPlayer);
});