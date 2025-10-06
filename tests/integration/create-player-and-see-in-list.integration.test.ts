import { test, expect } from 'vitest';
import { v4 as uuid } from 'uuid';

test('should be able to create a player and see them in the list', async () => {
  const newPlayerName = `test-player-${uuid()}`;
  
  // Create a new player
  const createPlayerResponse = await fetch('http://localhost:3000/api/players', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      displayName: newPlayerName,
    }),
  });

  expect(createPlayerResponse.status).toBe(201);
  const createdPlayer = await createPlayerResponse.json();
  expect(createdPlayer.displayName).toBe(newPlayerName);

  // Get the list of players
  const getPlayersResponse = await fetch('http://localhost:3000/api/players');
  const players = await getPlayersResponse.json();

  // Check if the new player is in the list
  const newPlayerInList = players.find((player) => player.id === createdPlayer.id);
  expect(newPlayerInList).toBeDefined();
  expect(newPlayerInList.displayName).toBe(newPlayerName);
});