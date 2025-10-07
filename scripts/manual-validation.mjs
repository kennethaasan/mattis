import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Client } from "pg";

const baseUrl = "http://localhost:3000";
const devUserId = process.env.DEV_USER_ID ?? "00000000-0000-7000-0000-000000000000";
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set to run manual validation.");
}

const authHeaders = {
  "Content-Type": "application/json",
  "X-User-Id": devUserId,
};

const pgClient = new Client({ connectionString: databaseUrl });
await pgClient.connect();

async function shiftTimestamp(table, column, idColumn, idValue, hours) {
  await pgClient.query(
    `UPDATE ${table} SET ${column} = ${column} - (INTERVAL '1 hour' * $1) WHERE ${idColumn} = $2`,
    [hours, idValue],
  );
}

async function createPlayer(displayName) {
  const response = await fetch(`${baseUrl}/api/players`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ display_name: displayName }),
  });
  assert.equal(response.status, 201, `Expected 201 when creating player, got ${response.status}`);
  const body = await response.json();
  assert.ok(body.id, "Player response must include id.");
  assert.equal(body.display_name, displayName);
  return body;
}

async function fetchPlayers() {
  const response = await fetch(`${baseUrl}/api/players`);
  assert.equal(response.status, 200, `Expected 200 when listing players, got ${response.status}`);
  return response.json();
}

async function createRound(participantIds, loserId) {
  const response = await fetch(`${baseUrl}/api/rounds`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ participant_ids: participantIds, loser_id: loserId }),
  });
  assert.equal(response.status, 201, `Expected 201 when creating round, got ${response.status}`);
  const body = await response.json();
  assert.ok(body.id, "Round response must include id.");
  return body;
}

async function updateRound(roundId, participantIds, loserId) {
  const response = await fetch(`${baseUrl}/api/rounds/${roundId}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ participant_ids: participantIds, loser_id: loserId }),
  });
  return { status: response.status, body: await response.json().catch(() => ({})) };
}

async function deleteRound(roundId) {
  const response = await fetch(`${baseUrl}/api/rounds/${roundId}`, {
    method: "DELETE",
    headers: authHeaders,
  });
  return { status: response.status };
}

async function createFettMattis(playerId, roundId) {
  const payload = roundId ? { player_id: playerId, round_id: roundId } : { player_id: playerId };

  const response = await fetch(`${baseUrl}/api/fettmattis`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(payload),
  });
  assert.equal(response.status, 201, `Expected 201 when creating FettMattis, got ${response.status}`);
  const body = await response.json();
  assert.ok(body.id, "FettMattis response must include id.");
  return body;
}

async function revokeFettMattis(fettMattisId) {
  const response = await fetch(`${baseUrl}/api/fettmattis/${fettMattisId}`, {
    method: "DELETE",
    headers: authHeaders,
  });
  return { status: response.status, body: await response.json().catch(() => ({})) };
}

async function getRegularLeaderboard(year) {
  const response = await fetch(`${baseUrl}/api/leaderboard/regular?year=${year}`);
  assert.equal(response.status, 200, `Expected 200 when fetching regular leaderboard, got ${response.status}`);
  return response.json();
}

async function getFettMattisLeaderboard(year) {
  const response = await fetch(`${baseUrl}/api/leaderboard/fettmattis?year=${year}`);
  assert.equal(response.status, 200, `Expected 200 when fetching FettMattis leaderboard, got ${response.status}`);
  return response.json();
}

const year = new Date().getUTCFullYear();
const playerOne = await createPlayer(`Manual Player ${randomUUID()}`);
const playerTwo = await createPlayer(`Manual Player ${randomUUID()}`);

const players = await fetchPlayers();
assert(players.some((p) => p.id === playerOne.id), "Created playerOne must be present in player list.");
assert(players.some((p) => p.id === playerTwo.id), "Created playerTwo must be present in player list.");

const roundRecent = await createRound([playerOne.id, playerTwo.id], playerOne.id);
const updateResult = await updateRound(roundRecent.id, [playerOne.id, playerTwo.id], playerTwo.id);
assert.equal(updateResult.status, 200, `Expected round update within window to succeed, got ${updateResult.status}`);

const leaderboardAfterRound = await getRegularLeaderboard(year);
const entryOne = leaderboardAfterRound.find((item) => item.player.id === playerOne.id);
const entryTwo = leaderboardAfterRound.find((item) => item.player.id === playerTwo.id);
assert(entryOne, "Loser must appear on leaderboard.");
assert(entryTwo, "Winner must appear on leaderboard.");

const fettMattisActive = await createFettMattis(playerTwo.id, null);
const fettMattisLeaderboard = await getFettMattisLeaderboard(year);
const fettEntry = fettMattisLeaderboard.find((item) => item.player.id === playerTwo.id);
assert(fettEntry, "FettMattis recipient must appear on leaderboard.");
assert.equal(fettEntry.fettmattis_count, 1, "FettMattis count should be 1 after creation.");

const revokeResult = await revokeFettMattis(fettMattisActive.id);
assert.equal(revokeResult.status, 204, `Expected revocation within window to succeed, got ${revokeResult.status}`);

const roundAged = await createRound([playerOne.id, playerTwo.id], playerOne.id);
await shiftTimestamp("rounds", "created_at", "id", roundAged.id, 26);

const agedUpdate = await updateRound(roundAged.id, [playerOne.id, playerTwo.id], playerTwo.id);
assert.equal(agedUpdate.status, 403, "Updating a round after 24h must be forbidden.");

const agedDelete = await deleteRound(roundAged.id);
assert.equal(agedDelete.status, 403, "Deleting a round after 24h must be forbidden.");

const fettMattisOld = await createFettMattis(playerOne.id, roundRecent.id);
await shiftTimestamp("fettmattis", "created_at", "id", fettMattisOld.id, 26);

const revokeOld = await revokeFettMattis(fettMattisOld.id);
assert.equal(revokeOld.status, 403, "Revoking a FettMattis after 24h must be forbidden.");

await pgClient.end();

console.log("Manual validation steps completed successfully.");
