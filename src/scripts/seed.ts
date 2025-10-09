import "dotenv/config";
import { Client } from "pg";

import { DEFAULT_DEV_USER_ID } from "@/env";

interface PlayerSeed {
  key: string;
  id: string;
  displayName: string;
  userId?: string;
  active?: boolean;
}

interface RoundSeed {
  key: string;
  id: string;
  label: string;
  createdAt: Date;
  participants: string[];
  loser: string;
  createdBy: string;
}

interface FettMattisSeed {
  id: string;
  player: string;
  round: string | null;
  createdAt: Date;
  createdBy: string;
}

interface PlayerRecord {
  id: string;
  displayName: string;
}

interface RoundRecord {
  id: string;
}

const writeLine = (stream: NodeJS.WritableStream, message: string): void => {
  stream.write(`${message}\n`);
};

const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.stack ?? `${error.name}: ${error.message}`;
  }

  return String(error);
};

const currentYear = new Date().getUTCFullYear();
const devUserId = process.env.DEV_USER_ID ?? DEFAULT_DEV_USER_ID;

const playerSeeds: PlayerSeed[] = [
  {
    key: "astrid",
    id: "10000000-0000-4000-8000-000000000101",
    displayName: "Astrid Nygaard",
    userId: devUserId,
    active: true,
  },
  {
    key: "emil",
    id: "10000000-0000-4000-8000-000000000102",
    displayName: "Emil Kavli",
    active: true,
  },
  {
    key: "lina",
    id: "10000000-0000-4000-8000-000000000103",
    displayName: "Lina Moritz",
    active: true,
  },
  {
    key: "rex",
    id: "10000000-0000-4000-8000-000000000104",
    displayName: "Rex Holm",
    active: true,
  },
  {
    key: "zia",
    id: "10000000-0000-4000-8000-000000000105",
    displayName: "Zia Idris",
    active: false,
  },
];

const roundSeeds: RoundSeed[] = [
  {
    key: "january_kickoff",
    id: "20000000-0000-4000-8000-000000000201",
    label: "January kickoff round",
    createdAt: new Date(Date.UTC(currentYear, 0, 5, 19, 30, 0)),
    participants: ["astrid", "emil", "lina"],
    loser: "emil",
    createdBy: devUserId,
  },
  {
    key: "midwinter_clash",
    id: "20000000-0000-4000-8000-000000000202",
    label: "Midwinter clash",
    createdAt: new Date(Date.UTC(currentYear, 0, 12, 22, 15, 0)),
    participants: ["astrid", "lina", "rex"],
    loser: "rex",
    createdBy: devUserId,
  },
  {
    key: "weekend_finale",
    id: "20000000-0000-4000-8000-000000000203",
    label: "Weekend finale",
    createdAt: new Date(Date.UTC(currentYear, 0, 18, 18, 45, 0)),
    participants: ["emil", "lina", "rex"],
    loser: "emil",
    createdBy: devUserId,
  },
];

const fettMattisSeeds: FettMattisSeed[] = [
  {
    id: "30000000-0000-4000-8000-000000000301",
    player: "lina",
    round: "january_kickoff",
    createdAt: new Date(Date.UTC(currentYear, 0, 5, 20, 15, 0)),
    createdBy: devUserId,
  },
  {
    id: "30000000-0000-4000-8000-000000000302",
    player: "rex",
    round: "midwinter_clash",
    createdAt: new Date(Date.UTC(currentYear, 0, 12, 22, 45, 0)),
    createdBy: devUserId,
  },
  {
    id: "30000000-0000-4000-8000-000000000303",
    player: "astrid",
    round: null,
    createdAt: new Date(Date.UTC(currentYear, 0, 15, 18, 30, 0)),
    createdBy: devUserId,
  },
];

async function seed(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be set before running the seed script.");
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  writeLine(process.stdout, "Starting database seed...");

  let transactionStarted = false;

  try {
    await client.query("BEGIN");
    transactionStarted = true;

    await resetTables(client);
    await ensureDevUser(client);
    const players = await insertPlayers(client);
    const rounds = await insertRounds(client, players);
    await insertFettMattis(client, players, rounds);

    await client.query("COMMIT");
    writeLine(process.stdout, "Database seed completed successfully.");
  } catch (error: unknown) {
    if (transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError: unknown) {
        writeLine(process.stderr, `Rollback failed: ${formatError(rollbackError)}`);
      }
    }

    writeLine(process.stderr, `Database seed failed: ${formatError(error)}`);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

async function resetTables(client: Client): Promise<void> {
  writeLine(process.stdout, "Clearing existing data...");
  await client.query("DELETE FROM fettmattis");
  await client.query("DELETE FROM round_loser");
  await client.query("DELETE FROM round_participants");
  await client.query("DELETE FROM rounds");
  await client.query("DELETE FROM players");
  await client.query("DELETE FROM users");
}

async function ensureDevUser(client: Client): Promise<void> {
  const username = `dev-${devUserId.slice(0, 8)}`;

  await client.query(
    `
      INSERT INTO users (id, username)
      VALUES ($1, $2)
      ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, updated_at = NOW()
    `,
    [devUserId, username],
  );

  writeLine(process.stdout, `Ensured developer user ${username}.`);
}

async function insertPlayers(client: Client): Promise<Map<string, PlayerRecord>> {
  writeLine(process.stdout, "Inserting players...");
  const playerMap = new Map<string, PlayerRecord>();

  for (const player of playerSeeds) {
    const { rows } = await client.query<{ id: string; display_name: string }>(
      `
        INSERT INTO players (id, display_name, user_id, active)
        VALUES ($1, $2, $3, $4)
        RETURNING id, display_name
      `,
      [player.id, player.displayName, player.userId ?? null, player.active ?? true],
    );

    const [created] = rows;
    if (!created) {
      throw new Error(`Failed to insert player ${player.displayName}.`);
    }

    playerMap.set(player.key, {
      id: created.id,
      displayName: created.display_name,
    });

    writeLine(process.stdout, `  • ${player.displayName}`);
  }

  return playerMap;
}

async function insertRounds(client: Client, players: Map<string, PlayerRecord>): Promise<Map<string, RoundRecord>> {
  writeLine(process.stdout, "Recording rounds...");
  const roundsMap = new Map<string, RoundRecord>();

  for (const round of roundSeeds) {
    const participantIds = round.participants.map((key) => {
      const record = players.get(key);
      if (!record) {
        throw new Error(`Participant ${key} not found while seeding round ${round.key}.`);
      }
      return record.id;
    });

    const loser = players.get(round.loser);
    if (!loser) {
      throw new Error(`Loser ${round.loser} not found while seeding round ${round.key}.`);
    }

    await client.query(
      `
        INSERT INTO rounds (id, created_by, created_at, deleted_at)
        VALUES ($1, $2, $3, NULL)
      `,
      [round.id, round.createdBy, round.createdAt.toISOString()],
    );

    for (const participantId of participantIds) {
      await client.query(
        `
          INSERT INTO round_participants (round_id, player_id)
          VALUES ($1, $2)
        `,
        [round.id, participantId],
      );
    }

    await client.query(
      `
        INSERT INTO round_loser (round_id, loser_id)
        VALUES ($1, $2)
      `,
      [round.id, loser.id],
    );

    roundsMap.set(round.key, { id: round.id });
    writeLine(process.stdout, `  • ${round.label}`);
  }

  return roundsMap;
}

async function insertFettMattis(
  client: Client,
  players: Map<string, PlayerRecord>,
  rounds: Map<string, RoundRecord>,
): Promise<void> {
  writeLine(process.stdout, "Awarding Fettmattis records...");

  for (const entry of fettMattisSeeds) {
    const player = players.get(entry.player);
    if (!player) {
      throw new Error(`Fettmattis player ${entry.player} not found.`);
    }

    const roundRecord = entry.round ? rounds.get(entry.round) : null;
    if (entry.round && !roundRecord) {
      throw new Error(`Fettmattis round ${entry.round} not found.`);
    }

    await client.query(
      `
        INSERT INTO fettmattis (id, player_id, round_id, created_by, created_at, revoked_at)
        VALUES ($1, $2, $3, $4, $5, NULL)
      `,
      [entry.id, player.id, roundRecord ? roundRecord.id : null, entry.createdBy, entry.createdAt.toISOString()],
    );

    writeLine(process.stdout, `  • ${player.displayName}`);
  }
}

await seed();
