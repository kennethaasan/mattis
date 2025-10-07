
import { test, expect } from '@playwright/test';

test.describe('Main user flows', () => {
  test('Create a player and see them in the player list', async ({ page }) => {
    await page.goto('/players');

    const playerName = `Player ${Date.now()}`;

    await page.getByLabel('Display Name').fill(playerName);
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByText(playerName)).toBeVisible();
  });

  test('Record a round and verify the leaderboard updates', async ({ page }) => {
    // 1. Create two players
    await page.goto('/players');
    const playerA = `Player A ${Date.now()}`;
    const playerB = `Player B ${Date.now()}`;
    await page.getByLabel('Display Name').fill(playerA);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel('Display Name').fill(playerB);
    await page.getByRole('button', { name: 'Submit' }).click();

    // 2. Record a round where Player A loses to Player B
    await page.goto('/rounds');
    await page.getByLabel('Participants').click();
    await page.getByText(playerA).click();
    await page.getByText(playerB).click();
    await page.getByLabel('Loser').click();
    await page.getByText(playerA).click();
    await page.getByRole('button', { name: 'Submit' }).click();

    // 3. Verify the leaderboard
    await page.goto('/leaderboard');
    await expect(page.getByRole('cell', { name: playerA })).toBeVisible();
    await expect(page.getByRole('cell', { name: '1' }).first()).toBeVisible(); // Total losses
    await expect(page.getByRole('cell', { name: '1' }).last()).toBeVisible(); // Rounds played
    await expect(page.getByRole('cell', { name: '100.00%' })).toBeVisible();
  });
});
