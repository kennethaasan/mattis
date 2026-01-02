import { expect, test } from "@playwright/test";
import { v7 as uuidV7 } from "uuid";
import type { components } from "@/lib/api/generated";
import { loginAsTestUser } from "./helpers/auth";

type ApiPlayer = components["schemas"]["Player"];
type ApiRound = components["schemas"]["Round"];
type ApiFettmattis = components["schemas"]["Fettmattis"];

const ASTRID = "Astrid Nygaard";
const EMIL = "Emil Kavli";
const LINA = "Lina Moritz";
const REX = "Rex Holm";

test.beforeEach(async ({ page }) => {
  await loginAsTestUser(page);
});

test("T037: user can create a player from the roster page", async ({
  page,
}) => {
  await page.goto("/players", { waitUntil: "domcontentloaded" });
  await page.waitForSelector('label:has-text("Visningsnavn")');

  const displayName = `Autotest ${uuidV7()}`;
  await page.getByLabel("Visningsnavn").fill(displayName);
  const createResponsePromise = page.waitForResponse((response) => {
    if (!response.url().endsWith("/api/players")) {
      return false;
    }
    const request = response.request();
    return request.method() === "POST" && response.status() === 201;
  });

  await page.getByRole("button", { name: "Lagre spiller" }).click();
  await createResponsePromise;

  await expect(
    page.getByText("Spiller lagt til i troppen. Velkommen!"),
  ).toBeVisible();

  const playerCell = page.getByRole("cell", {
    name: displayName,
    exact: true,
  });
  await expect(playerCell).toBeVisible();

  const playersResponse = await page.request.get("/api/players");
  expect(playersResponse.ok()).toBeTruthy();
  const players = (await playersResponse.json()) as ApiPlayer[];
  const createdPlayer = players.find(
    (player) => player.display_name === displayName,
  );
  expect(createdPlayer).toBeDefined();

  if (createdPlayer) {
    const deactivateResponse = await page.request.put(
      `/api/players/${createdPlayer.id}`,
      {
        data: { active: false },
      },
    );
    expect(deactivateResponse.ok()).toBeTruthy();
  }
});

test("T037: recording a round confirms the success banner", async ({
  page,
}) => {
  await page.goto("/rounds", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(`button:has-text("${ASTRID}")`);

  for (const participant of [ASTRID, LINA, REX]) {
    await page
      .getByRole("button", { name: new RegExp(participant, "i") })
      .click();
  }
  await page.getByLabel("Taper").selectOption({ label: REX });
  await page.getByRole("button", { name: "Lagre runde" }).click();

  await expect(
    page.getByText("Runde lagret. Tabellene er oppdatert!"),
  ).toBeVisible();

  const latestRoundResponse = await page.request.get("/api/rounds/latest");
  expect(latestRoundResponse.ok()).toBeTruthy();
  const latestRound = (await latestRoundResponse.json()) as ApiRound | null;
  expect(latestRound).not.toBeNull();
  if (!latestRound) {
    throw new Error("Latest round was not returned after creation.");
  }

  const roundButtons = page.locator(
    `button[aria-controls="round-details-${latestRound.id}"]`,
  );
  await expect(roundButtons).toBeVisible();
  await roundButtons.click();

  const roundDetails = page.locator(`#round-details-${latestRound.id}`);
  await expect(roundDetails).toBeVisible();
  await expect(roundDetails.getByText("Taper")).toBeVisible();
  await expect(roundDetails.getByText(REX).first()).toBeVisible();

  const roundRow = page.locator("tr").filter({ has: roundButtons }).first();
  const deleteButton = roundRow.getByRole("button", { name: "Slett" });
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();

  await expect(
    page.getByText("Runde slettet. Tabellene er oppdatert!"),
  ).toBeVisible();
  await expect(roundButtons).toHaveCount(0);
});

test("T037: user can toggle player activity from the roster", async ({
  page,
}) => {
  await page.goto("/players", { waitUntil: "domcontentloaded" });

  const targetRow = page.getByRole("row", { name: new RegExp(REX, "i") });
  await expect(targetRow).toBeVisible();

  const deactivateButton = targetRow.getByRole("button", {
    name: "Sett som inaktiv",
  });
  await deactivateButton.click();

  await expect(page.getByText(`${REX} er nå inaktiv.`)).toBeVisible();
  await expect(
    targetRow.getByRole("cell", { name: "Inaktiv" }).first(),
  ).toBeVisible();

  const activateButton = targetRow.getByRole("button", {
    name: "Sett som aktiv",
  });
  await activateButton.click();

  await expect(page.getByText(`${REX} er nå aktiv.`)).toBeVisible();
  await expect(
    targetRow.getByRole("cell", { name: "Aktiv" }).first(),
  ).toBeVisible();
});

test("T037: leaderboard view surfaces regular and Fettmattis standings", async ({
  page,
}) => {
  await page.goto("/leaderboard", { waitUntil: "domcontentloaded" });

  const regularTable = page.getByRole("table").filter({
    has: page.getByRole("columnheader", {
      name: "Tap %",
      exact: true,
    }),
  });
  await expect(regularTable).toBeVisible();
  await expect(
    regularTable.getByRole("row", { name: new RegExp(EMIL, "i") }),
  ).toBeVisible();
  await expect(
    regularTable.getByRole("row", { name: new RegExp(REX, "i") }),
  ).toBeVisible();
  await expect(
    regularTable.getByRole("row", { name: new RegExp(LINA, "i") }),
  ).toBeVisible();

  const fettmattisTable = page.getByRole("table").filter({
    has: page.getByRole("columnheader", {
      name: "Fettmattis",
      exact: true,
    }),
  });
  await expect(fettmattisTable).toBeVisible();
  await expect(
    fettmattisTable.getByRole("row", { name: new RegExp(ASTRID, "i") }),
  ).toBeVisible();
  await expect(
    fettmattisTable.getByRole("row", { name: new RegExp(LINA, "i") }),
  ).toBeVisible();
});

test("T193: rounds dashboard enforces 24-hour deletion window", async ({
  page,
}) => {
  await page.goto("/rounds", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(`button:has-text("${ASTRID}")`);
  const archivedRoundButton = page.locator(
    'button[aria-controls="round-details-20000000-0000-4000-8000-000000000201"]',
  );
  await expect(archivedRoundButton).toBeVisible();

  const archivedRoundRow = page
    .locator("tr")
    .filter({ has: archivedRoundButton })
    .first();
  await expect(
    archivedRoundRow.getByRole("button", { name: "Slett" }),
  ).toHaveCount(0);

  for (const participant of [ASTRID, EMIL, LINA]) {
    await page
      .getByRole("button", { name: new RegExp(participant, "i") })
      .click();
  }
  await page.getByLabel("Taper").selectOption({ label: EMIL });
  await page.getByRole("button", { name: "Lagre runde" }).click();

  await expect(
    page.getByText("Runde lagret. Tabellene er oppdatert!"),
  ).toBeVisible();

  const latestRoundResponse = await page.request.get("/api/rounds/latest");
  expect(latestRoundResponse.ok()).toBeTruthy();
  const latestRound = (await latestRoundResponse.json()) as ApiRound | null;
  if (!latestRound) {
    throw new Error("Latest round was not available for verification.");
  }

  const latestRoundDetailsButton = page
    .locator(`button[aria-controls="round-details-${latestRound.id}"]`)
    .first();
  await latestRoundDetailsButton.click();

  const latestRoundDetails = page.locator(`#round-details-${latestRound.id}`);
  await expect(latestRoundDetails).toBeVisible();
  await expect(latestRoundDetails.getByText("Taper")).toBeVisible();
  await expect(latestRoundDetails.getByText(EMIL).first()).toBeVisible();

  const latestRoundDeleteButton = page
    .locator("tr")
    .filter({
      has: page.locator(
        `button[aria-controls="round-details-${latestRound.id}"]`,
      ),
    })
    .first()
    .getByRole("button", { name: "Slett" });
  await expect(latestRoundDeleteButton).toBeVisible();
  await latestRoundDeleteButton.click();

  await expect(
    page.getByText("Runde slettet. Tabellene er oppdatert!"),
  ).toBeVisible();
  await expect(
    page.locator(`button[aria-controls="round-details-${latestRound.id}"]`),
  ).toHaveCount(0);

  const archivedFettmattisButton = page.locator(
    'button[aria-controls="fettmattis-details-30000000-0000-4000-8000-000000000302"]',
  );
  await expect(archivedFettmattisButton).toBeVisible();

  const archivedFettmattisRow = page
    .locator("tr")
    .filter({ has: archivedFettmattisButton })
    .first();
  await expect(
    archivedFettmattisRow.getByRole("button", { name: "Slett" }),
  ).toHaveCount(0);

  await page.getByLabel("Spiller").selectOption({ label: LINA });
  await page.getByRole("button", { name: "Tildel Fettmattis" }).click();
  await expect(
    page.getByText("Fettmattis tildelt. Klar for feiring!"),
  ).toBeVisible();

  const fettmattisResponse = await page.request.get("/api/fettmattis?limit=1");
  expect(fettmattisResponse.ok()).toBeTruthy();
  const [latestFettmattis] =
    (await fettmattisResponse.json()) as ApiFettmattis[];
  if (!latestFettmattis) {
    throw new Error("Latest Fettmattis entry was not returned after creation.");
  }

  const latestFettmattisDetailsButton = page
    .locator(
      `button[aria-controls="fettmattis-details-${latestFettmattis.id}"]`,
    )
    .first();
  const latestFettmattisRow = page
    .locator("tr")
    .filter({ has: latestFettmattisDetailsButton })
    .first();
  await latestFettmattisDetailsButton.click();

  const latestFettmattisDetails = page.locator(
    `#fettmattis-details-${latestFettmattis.id}`,
  );
  await expect(latestFettmattisDetails).toBeVisible();
  await expect(
    latestFettmattisDetails.getByText("Spillerstatus"),
  ).toBeVisible();
  await expect(
    latestFettmattisDetails.getByText("Endringsvindu"),
  ).toBeVisible();

  const latestFettmattisDeleteButton = latestFettmattisRow.getByRole("button", {
    name: "Slett",
  });
  await expect(latestFettmattisDeleteButton).toBeVisible();
  await latestFettmattisDeleteButton.click();

  await expect(
    page.getByText("Fettmattis fjernet. Oversikten er oppdatert."),
  ).toBeVisible();
  await expect(
    page.locator(
      `button[aria-controls="fettmattis-details-${latestFettmattis.id}"]`,
    ),
  ).toHaveCount(0);
});
