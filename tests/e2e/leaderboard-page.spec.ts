import { expect, test } from "@playwright/test";

test.describe("Leaderboard Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/leaderboard", { waitUntil: "domcontentloaded" });
  });

  test("loads and displays leaderboard content", async ({ page }) => {
    await test.step("Verify page heading is visible", async () => {
      await expect(
        page.getByRole("heading", { name: "Tabeller", level: 1 }),
      ).toBeVisible();
    });

    await test.step("Verify both leaderboard sections exist", async () => {
      await expect(
        page.getByRole("heading", { name: "Vanlig tabell" }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Fettmattis-utdelinger" }),
      ).toBeVisible();
    });

    await test.step("Verify year filter is present", async () => {
      const yearFilter = page.getByRole("combobox");
      await expect(yearFilter).toBeVisible();
    });

    await test.step("Verify Regular leaderboard table structure", async () => {
      const tables = page.getByRole("table");
      const regularTable = tables.first();
      await expect(regularTable).toBeVisible();

      await expect(
        regularTable.getByRole("columnheader", { name: "Plass" }),
      ).toBeVisible();
      await expect(
        regularTable.getByRole("columnheader", { name: "Spiller" }),
      ).toBeVisible();
      await expect(
        regularTable.getByRole("columnheader", { name: "Tap %" }),
      ).toBeVisible();
      await expect(
        regularTable.getByRole("columnheader", { name: "Tap", exact: true }),
      ).toBeVisible();
      await expect(
        regularTable.getByRole("columnheader", { name: "Runder" }),
      ).toBeVisible();
    });
  });

  test("displays both leaderboards simultaneously", async ({ page }) => {
    await test.step("Verify Regular leaderboard section", async () => {
      const regularSection = page
        .getByRole("heading", { name: "Vanlig tabell" })
        .locator("..");
      await expect(regularSection).toBeVisible();
    });

    await test.step("Verify FettMattis leaderboard section", async () => {
      const fettmattisSection = page
        .getByRole("heading", { name: "Fettmattis-utdelinger" })
        .locator("..");
      await expect(fettmattisSection).toBeVisible();
    });

    await test.step("Verify FettMattis table structure", async () => {
      // Wait for the page to fully load
      await page.waitForLoadState("networkidle");

      const tables = page.getByRole("table");
      const tableCount = await tables.count();

      // Check if we have a second table (FettMattis) or an empty state message
      if (tableCount >= 2) {
        const fettmattisTable = tables.nth(1);
        await expect(fettmattisTable).toBeVisible();
        await expect(
          fettmattisTable.getByRole("columnheader", { name: "Plass" }),
        ).toBeVisible();
        await expect(
          fettmattisTable.getByRole("columnheader", { name: "Spiller" }),
        ).toBeVisible();
        await expect(
          fettmattisTable.getByRole("columnheader", { name: "FettMattis" }),
        ).toBeVisible();
      } else {
        // Verify empty state message is shown
        const emptyStateMessage = page.getByText(/ingen fettmattis utdelt/i);
        await expect(emptyStateMessage).toBeVisible();
      }
    });
  });

  test("filters leaderboard by year", async ({ page }) => {
    await test.step("Select year from dropdown", async () => {
      const yearFilter = page.getByRole("combobox");
      const currentYear = new Date().getFullYear();
      await yearFilter.selectOption(currentYear.toString());
    });

    await test.step("Verify heading reflects selected year", async () => {
      const currentYear = new Date().getFullYear();
      await expect(
        page.getByRole("heading", {
          name: `Sesongoversikt for ${currentYear}`,
        }),
      ).toBeVisible();
    });

    await test.step("Verify tables still display", async () => {
      const regularTable = page.getByRole("table").first();
      await expect(regularTable).toBeVisible();
    });
  });

  test("handles empty leaderboard state gracefully", async ({ page }) => {
    await test.step("Find oldest available year in dropdown", async () => {
      const yearFilter = page.getByRole("combobox");

      // Get all options from the select element
      const options = await yearFilter.locator("option").allTextContents();

      // Find the oldest year (excluding "Alle år")
      const years = options
        .filter((opt) => opt !== "Alle år")
        .map((opt) => Number.parseInt(opt, 10))
        .filter((year) => !Number.isNaN(year))
        .sort((a, b) => a - b);

      if (!years[0]) {
        throw new Error("No valid years found in the year filter dropdown.");
      }

      // Select the oldest year available
      await yearFilter.selectOption(years[0].toString());
    });

    await test.step("Verify empty state messages can appear OR tables display", async () => {
      // Wait for content to load
      await page.waitForLoadState("networkidle");

      const emptyRegularMessage = page.getByText(/ingen runder registrert/i);
      const emptyFettmattisMessage = page.getByText(/ingen fettmattis utdelt/i);
      const regularTable = page.getByRole("table").first();

      // Either we see empty state messages OR we see tables with data
      const hasRegularEmpty = await emptyRegularMessage
        .isVisible()
        .catch(() => false);
      const hasFettmattisEmpty = await emptyFettmattisMessage
        .isVisible()
        .catch(() => false);
      const hasRegularTable = await regularTable.isVisible().catch(() => false);

      // The page should show something (either empty state or table)
      expect(hasRegularEmpty || hasFettmattisEmpty || hasRegularTable).toBe(
        true,
      );
    });
  });
});
