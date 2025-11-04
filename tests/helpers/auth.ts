import type { Page } from "@playwright/test";

export async function loginAsTestUser(page: Page): Promise<void> {
  const username = process.env.BASIC_AUTH_USERNAME;
  const password = process.env.BASIC_AUTH_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "BASIC_AUTH_USERNAME and BASIC_AUTH_PASSWORD must be set in environment"
    );
  }

  await page.goto("/login", { waitUntil: "domcontentloaded" });

  await page.getByLabel("E-post").fill(username);
  await page.getByLabel("Passord").fill(password);

  await page.getByRole("button", { name: "Logg inn" }).click();

  await page.waitForURL("/rounds");
}
