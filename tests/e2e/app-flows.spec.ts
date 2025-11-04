import { expect, test } from "@playwright/test";
import { loginAsTestUser } from "../helpers/auth";

test.beforeEach(async ({ page }) => {
  await loginAsTestUser(page);
});

test("T037: user can create a player from the roster page", async ({
  page,
}) => {
  const players = [
    {
      id: "00000000-0000-7000-0000-000000000101",
      display_name: "Harper",
      active: true,
    },
  ];

  await page.route("**/api/players", async (route, request) => {
    if (request.method() === "POST") {
      const body = (await request.postDataJSON()) as { display_name: string };
      const newPlayer = {
        id: "00000000-0000-7000-0000-000000000199",
        display_name: body.display_name,
        active: true,
      };
      players.push(newPlayer);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(newPlayer),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(players),
    });
  });

  await page.goto("/players");
  
  // Wait for the form to be ready
  await page.waitForSelector('label:has-text("Visningsnavn")');

  await page.getByLabel("Visningsnavn").fill("Nova");
  await page.getByRole("button", { name: "Lagre spiller" }).click();

  await expect(
    page.getByText("Spiller lagt til i troppen. Velkommen!"),
  ).toBeVisible();
  await expect(page.getByRole("cell", { name: "Nova" })).toBeVisible();
});

test("T037: recording a round confirms the success banner", async ({
  page,
}) => {
  const roster = [
    {
      id: "00000000-0000-7000-0000-000000000301",
      display_name: "Alex",
      active: true,
    },
    {
      id: "00000000-0000-7000-0000-000000000302",
      display_name: "Blair",
      active: true,
    },
  ];

  await page.route("**/api/players", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(roster),
    });
  });

  await page.route("**/api/rounds/latest", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "null",
    });
  });

  await page.route("**/api/rounds", async (route, request) => {
    expect(request.method()).toBe("POST");
    const body = (await request.postDataJSON()) as {
      participant_ids: string[];
      loser_id: string;
    };
    expect(body.participant_ids).toContain(roster[0]?.id);
    expect(body.participant_ids).toContain(roster[1]?.id);
    expect(body.loser_id).toBe(roster[1]?.id);

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        id: "00000000-0000-7000-0000-000000000399",
        created_at: new Date().toISOString(),
        participants: roster.map((player) => ({
          id: player.id,
          display_name: player.display_name,
          active: player.active,
        })),
        loser: {
          id: roster[1]?.id,
          display_name: roster[1]?.display_name,
          active: roster[1]?.active,
        },
      }),
    });
  });

  await page.goto("/rounds");
  
  // Wait for player buttons to be available
  await page.waitForSelector('button:has-text("Alex")');

  await page.getByRole("button", { name: /Alex/i }).click();
  await page.getByRole("button", { name: /Blair/i }).click();
  await page.getByLabel("Taper").selectOption({ label: "Blair" });
  await page.getByRole("button", { name: "Lagre runde" }).click();

  await expect(
    page.getByText("Runde lagret. Tabellene er oppdatert!"),
  ).toBeVisible();
});

test("T037: user can toggle player activity from the roster", async ({
  page,
}) => {
  const players = [
    {
      id: "00000000-0000-7000-0000-000000000401",
      display_name: "Signe",
      active: true,
    },
  ];

  await page.route("**/api/players", async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(players),
      });
      return;
    }

    await route.fallback();
  });

  await page.route("**/api/players/*", async (route, request) => {
    expect(request.method()).toBe("PUT");
    const body = (await request.postDataJSON()) as { active: boolean };
    expect(body.active).toBe(false);

    const player = players.at(0);
    if (!player) {
      throw new Error("No player available for toggle test.");
    }
    player.active = body.active;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ...player }),
    });
  });

  await page.goto("/players");
  
  // Wait for and click the first "Set as inactive" button
  const inactiveButton = page.getByRole("button", { name: "Sett som inaktiv" }).first();
  await inactiveButton.waitFor({ state: "visible" });
  await inactiveButton.click();

  await expect(
    page.getByText("Signe er nå inaktiv.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("cell", { name: "Inaktiv" })).toBeVisible();
});

test("T037: leaderboard view surfaces regular and FettMattis standings", async ({
  page,
}) => {
  await page.route("**/api/leaderboard/regular**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          rank: 1,
          loss_percentage: 12.5,
          participation_count: 8,
          loss_count: 1,
          player: {
            id: "00000000-0000-7000-0000-000000000501",
            display_name: "Aria",
            active: true,
          },
        },
        {
          rank: 2,
          loss_percentage: 33.3,
          participation_count: 9,
          loss_count: 3,
          player: {
            id: "00000000-0000-7000-0000-000000000502",
            display_name: "Cato",
            active: true,
          },
        },
      ]),
    });
  });

  await page.route("**/api/leaderboard/fettmattis**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          rank: 1,
          fettmattis_count: 4,
          player: {
            id: "00000000-0000-7000-0000-000000000503",
            display_name: "Nova",
            active: true,
          },
        },
      ]),
    });
  });

  await page.goto("/leaderboard", { waitUntil: "domcontentloaded" });

  const regularTable = page
    .getByRole("table")
    .filter({
      has: page.getByRole("columnheader", {
        name: "Tap %",
        exact: true,
      }),
    });
  await expect(regularTable).toBeVisible();
  await expect(regularTable.getByRole("row", { name: /Aria/ })).toBeVisible();
  await expect(regularTable.getByRole("row", { name: /Cato/ })).toBeVisible();

  const fettMattisTable = page
    .getByRole("table")
    .filter({
      has: page.getByRole("columnheader", {
        name: "FettMattis",
        exact: true,
      }),
    });
  await expect(fettMattisTable).toBeVisible();
  await expect(
    fettMattisTable.getByRole("row", { name: /Nova/ }),
  ).toBeVisible();
});

test("T193: rounds dashboard enforces 24-hour deletion window", async ({
  page,
}) => {
  const now = Date.now();
  const recentRound = {
    id: "00000000-0000-7000-0000-000000000601",
    created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    participants: [
      {
        id: "00000000-0000-7000-0000-000000000611",
        display_name: "Linus",
        active: true,
      },
      {
        id: "00000000-0000-7000-0000-000000000612",
        display_name: "Maren",
        active: true,
      },
    ],
    loser: {
      id: "00000000-0000-7000-0000-000000000611",
      display_name: "Linus",
      active: true,
    },
  } as const;
  const archivedRound = {
    id: "00000000-0000-7000-0000-000000000602",
    created_at: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(),
    participants: [
      {
        id: "00000000-0000-7000-0000-000000000613",
        display_name: "Morgan",
        active: true,
      },
      {
        id: "00000000-0000-7000-0000-000000000614",
        display_name: "Iris",
        active: true,
      },
    ],
    loser: {
      id: "00000000-0000-7000-0000-000000000613",
      display_name: "Morgan",
      active: true,
    },
  } as const;

  const recentFettMattis = {
    id: "00000000-0000-7000-0000-000000000701",
    created_at: new Date(now - 60 * 60 * 1000).toISOString(),
    player: {
      id: "00000000-0000-7000-0000-000000000711",
      display_name: "Ada",
      active: true,
    },
  } as const;
  const archivedFettMattis = {
    id: "00000000-0000-7000-0000-000000000702",
    created_at: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
    player: {
      id: "00000000-0000-7000-0000-000000000712",
      display_name: "Erik",
      active: false,
    },
  } as const;

  const rounds = [structuredClone(recentRound), structuredClone(archivedRound)];
  const fettMattisEntries = [
    structuredClone(recentFettMattis),
    structuredClone(archivedFettMattis),
  ];

  let roundDeleteCalled = false;
  let fettMattisDeleteCalled = false;

  await page.route(/\/api\/players$/, async (route, request) => {
    if (request.method() !== "GET") {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { id: "00000000-0000-7000-0000-000000000611", display_name: "Linus", active: true },
        { id: "00000000-0000-7000-0000-000000000612", display_name: "Maren", active: true },
        { id: "00000000-0000-7000-0000-000000000613", display_name: "Morgan", active: true },
        { id: "00000000-0000-7000-0000-000000000614", display_name: "Iris", active: true },
        { id: "00000000-0000-7000-0000-000000000711", display_name: "Ada", active: true },
        { id: "00000000-0000-7000-0000-000000000712", display_name: "Erik", active: false },
      ]),
    });
  });

  await page.route("**/api/rounds/latest", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(recentRound),
    });
  });

  await page.route(/\/api\/rounds(\?.*)?$/, async (route, request) => {
    if (request.method() !== "GET") {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(rounds),
    });
  });

  await page.route(
    new RegExp(`/api/rounds/${recentRound.id.replaceAll("-", "\\-")}$`),
    async (route, request) => {
      expect(request.method()).toBe("DELETE");
      roundDeleteCalled = true;
      const index = rounds.findIndex((round) => round.id === recentRound.id);
      if (index >= 0) {
        rounds.splice(index, 1);
      }

      await route.fulfill({ status: 204, body: "" });
    },
  );

  await page.route(/\/api\/fettmattis(\?.*)?$/, async (route, request) => {
    if (request.method() !== "GET") {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(fettMattisEntries),
    });
  });

  await page.route(
    new RegExp(`/api/fettmattis/${recentFettMattis.id.replaceAll("-", "\\-")}$`),
    async (route, request) => {
      expect(request.method()).toBe("DELETE");
      fettMattisDeleteCalled = true;
      const index = fettMattisEntries.findIndex(
        (entry) => entry.id === recentFettMattis.id,
      );
      if (index >= 0) {
        fettMattisEntries.splice(index, 1);
      }

      await route.fulfill({ status: 204, body: "" });
    },
  );

  await page.goto("/rounds", { waitUntil: "networkidle" });

  const recentRoundRow = page.getByRole("row", { name: /Linus/ });
  await expect(recentRoundRow).toBeVisible();
  await expect(recentRoundRow.getByRole("button", { name: "Slett" })).toBeVisible();

  await recentRoundRow.getByRole("button", { name: "Detaljer" }).click();
  const roundDetails = page.locator(`#round-details-${recentRound.id}`);
  await expect(roundDetails).toBeVisible();
  await expect(roundDetails.getByText("Taper", { exact: false })).toBeVisible();

  const archivedRoundRow = page.getByRole("row", { name: /Morgan/ });
  await expect(archivedRoundRow.getByRole("button", { name: "Slett" })).toHaveCount(0);

  await recentRoundRow.getByRole("button", { name: "Slett" }).click();
  await expect(
    page.getByText("Runde slettet. Tabellene er oppdatert!"),
  ).toBeVisible();
  await expect(page.getByRole("row", { name: /Linus/ })).toHaveCount(0);

  expect(roundDeleteCalled).toBe(true);

  const recentFettMattisRow = page.getByRole("row", { name: /Ada/ });
  await expect(recentFettMattisRow.getByRole("button", { name: "Slett" })).toBeVisible();
  await recentFettMattisRow.getByRole("button", { name: "Detaljer" }).click();
  await expect(page.getByText("Spillerstatus")).toBeVisible();
  await expect(page.getByText("Endringsvindu")).toBeVisible();

  const archivedFettMattisRow = page.getByRole("row", { name: /Erik/ });
  await expect(
    archivedFettMattisRow.getByRole("button", { name: "Slett" }),
  ).toHaveCount(0);

  await recentFettMattisRow.getByRole("button", { name: "Slett" }).click();
  await expect(
    page.getByText("Fettmattis fjernet. Oversikten er oppdatert."),
  ).toBeVisible();
  await expect(page.getByRole("row", { name: /Ada/ })).toHaveCount(0);

  expect(fettMattisDeleteCalled).toBe(true);
});
