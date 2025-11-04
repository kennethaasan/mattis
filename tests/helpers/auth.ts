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

  await page.waitForResponse(
    (response) =>
      response.url().includes("/api/auth/get-session") && response.request().method() === "GET",
    { timeout: 30_000 },
  );

  await page.getByLabel("E-post").fill(username);
  await page.getByLabel("Passord").fill(password);

  const signInResponsePromise = page.waitForResponse((response) => {
    return (
      response.url().includes("/api/auth/sign-in/email") && response.status() === 200
    );
  });

  const loginButton = page.getByRole("button", { name: "Logg inn" });

  await page.waitForFunction(
    () => {
      const candidate = document.querySelector("form button[type='submit']");
      return candidate instanceof HTMLButtonElement && candidate.disabled === false;
    },
    { timeout: 30_000 },
  );

  await loginButton.click();
  await signInResponsePromise;

  await page.waitForURL("/rounds", { waitUntil: "domcontentloaded" });
}
