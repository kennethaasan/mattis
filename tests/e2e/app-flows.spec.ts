import { expect, test } from "@playwright/test";

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

  await page.goto("/players", { waitUntil: "networkidle" });

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

  await page.goto("/rounds", { waitUntil: "networkidle" });

  await page.getByRole("button", { name: /Alex/i }).click();
  await page.getByRole("button", { name: /Blair/i }).click();
  await page.getByLabel("Taper").selectOption({ label: "Blair" });
  await page.getByRole("button", { name: "Lagre runde" }).click();

  await expect(
    page.getByText("Runde lagret. Tabellene er oppdatert!"),
  ).toBeVisible();
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

  await page.goto("/leaderboard", { waitUntil: "networkidle" });

  const tables = await page.getByRole("table").all();

  const regularTable = tables.at(0);
  if (!regularTable) {
    throw new Error("Could not find the regular leaderboard table.");
  }
  await expect(regularTable.getByRole("row", { name: /Aria/ })).toBeVisible();
  await expect(regularTable.getByRole("row", { name: /Cato/ })).toBeVisible();

  const fettMattisTable = tables.at(1);
  if (!fettMattisTable) {
    throw new Error("Could not find the FettMattis leaderboard table.");
  }
  await expect(
    fettMattisTable.getByRole("row", { name: /Nova/ }),
  ).toBeVisible();
});
