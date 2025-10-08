import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays hero content and primary navigation', async ({ page }) => {
    await test.step('Verify the hero section highlights the product', async () => {
      await expect(
        page.getByRole('heading', {
          name: /beautiful home for every mattis round, loss and fettmattis celebration/i,
          level: 1,
        }),
      ).toBeVisible();

      await expect(
        page.getByRole('button', { name: /view live leaderboards/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /manage players/i }),
      ).toBeVisible();
    });

    await test.step('Ensure navigation includes key destinations', async () => {
      const nav = page.getByRole('navigation');
      await expect(nav.getByRole('link', { name: 'Overview' })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'Leaderboards' })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'Players' })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'Rounds' })).toBeVisible();
    });

    await test.step('Highlight cards summarise feature pillars', async () => {
      await expect(
        page.getByRole('heading', { name: 'Dual leaderboards', level: 3 }),
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Effortless player management', level: 3 }),
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Season-aware insights', level: 3 }),
      ).toBeVisible();
    });
  });
});
