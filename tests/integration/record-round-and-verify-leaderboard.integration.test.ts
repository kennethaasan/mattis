
import { test, expect } from 'vitest';
import { v4 as uuid } from 'uuid';

async function createPlayer(displayName) {
  const response = await fetch('http://localhost:3000/api/players', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ displayName: displayName }),
  });
  return response.json();
}

test('should be able to record a round and see the leaderboard update', async () => {
  const player1Name = `test-player-${uuid()}`;
  const player2Name = `test-player-${uuid()}`;

  const player1 = await createPlayer(player1Name);
  const player2 = await createPlayer(player2Name);

  // Record a round where player1 loses
  const roundResponse = await fetch('http://localhost:3000/api/rounds', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      participant_ids: [player1.id, player2.id],
      loser_id: player1.id,
    }),
  });

  expect(roundResponse.status).toBe(201);

  // Get the regular leaderboard
  const leaderboardResponse = await fetch('http://localhost:3000/api/leaderboard/regular');
  const leaderboard = await leaderboardResponse.json();

  // Find player1 in the leaderboard
  const player1Stats = leaderboard.find((p) => p.player.id === player1.id);

  // Assert that player1 has one loss and one participation
  expect(player1Stats).toBeDefined();
  expect(player1Stats.loss_count).toBe(1);
  expect(player1Stats.participation_count).toBe(1);
  expect(player1Stats.loss_percentage).toBe(100);
});
