import { expect, test } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
  });

  test("displays hero content and primary navigation", async ({ page }) => {
    await test.step("Verify the hero section highlights the product", async () => {
      await expect(
        page.getByRole("heading", {
          name: "Et vakkert hjem for hver Mattis-runde, hvert tap og hver Fettmattis-feiring.",
          level: 2,
        }),
      ).toBeVisible();
    });

    await test.step("Ensure navigation includes key destinations", async () => {
      const nav = page.getByRole("navigation");
      await expect(nav.getByRole("link", { name: "Oversikt" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Tabeller" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Spillere" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Runder" })).toBeVisible();
    });
  });

  test("T193: recent activity tables appear below the leaderboard", async ({
    page,
  }) => {
    const leaderboardHeading = page
      .getByRole("heading", { name: "Vanlig tabell", level: 3 })
      .first();
    const roundsHeading = page.getByRole("heading", {
      name: "De siste rundene",
      level: 3,
    });
    const fettmattisHeading = page.getByRole("heading", {
      name: "Ferske Fettmattiser",
      level: 3,
    });

    await expect(roundsHeading).toBeVisible();
    await expect(fettmattisHeading).toBeVisible();

    const leaderboardBox = await leaderboardHeading.boundingBox();
    const roundsBox = await roundsHeading.boundingBox();
    const fettmattisBox = await fettmattisHeading.boundingBox();

    if (!leaderboardBox || !roundsBox || !fettmattisBox) {
      throw new Error(
        "Unable to determine layout for leaderboard or activity tables.",
      );
    }

    expect(roundsBox.y).toBeGreaterThan(leaderboardBox.y);
    expect(fettmattisBox.y).toBeGreaterThan(leaderboardBox.y);
  });
});
