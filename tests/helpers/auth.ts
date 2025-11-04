import { expect, type Page } from "@playwright/test";

const RATE_LIMIT_MESSAGE = "Too many requests. Please try again later.";
const LOGIN_SUCCESS_PATH = "/rounds";
const MAX_LOGIN_ATTEMPTS = 3;

export async function loginAsTestUser(page: Page): Promise<void> {
  const username = process.env.BASIC_AUTH_USERNAME;
  const password = process.env.BASIC_AUTH_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "BASIC_AUTH_USERNAME and BASIC_AUTH_PASSWORD must be set in environment"
    );
  }

  // If we're already authenticated via a previous test, no work needed.
  if (page.url().includes(LOGIN_SUCCESS_PATH)) {
    return;
  }

  const navigateToLogin = async () => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    if (page.url().includes(LOGIN_SUCCESS_PATH)) {
      return true;
    }
    return false;
  };

  if (await navigateToLogin()) {
    return;
  }

  const attemptLogin = async () => {
    await page.getByLabel("E-post").fill(username);
    await page.getByLabel("Passord").fill(password);

    const loginButton = page.getByRole("button", { name: "Logg inn" });
    await expect(loginButton).toBeEnabled();
    await loginButton.click();

    await page.waitForURL(LOGIN_SUCCESS_PATH, {
      waitUntil: "domcontentloaded",
      timeout: 10_000,
    });
  };

  for (let attempt = 1; attempt <= MAX_LOGIN_ATTEMPTS; attempt += 1) {
    try {
      await attemptLogin();
      return;
    } catch (error) {
      const rateLimitNotice = page.getByText(RATE_LIMIT_MESSAGE);
      const isRateLimited = await rateLimitNotice.isVisible().catch(() => false);

      if (!isRateLimited || attempt === MAX_LOGIN_ATTEMPTS) {
        throw error;
      }

      const backoffMs = 1_000 * attempt;
      await page.waitForTimeout(backoffMs);
      await navigateToLogin();
    }
  }

  throw new Error("Unable to log in after multiple attempts.");
}
