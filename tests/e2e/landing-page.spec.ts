import { test, expect } from "@playwright/test";

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
});
