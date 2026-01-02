import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { basicAuthUser } from "@/lib/auth/basic-auth-config";
import * as schema from "@/lib/db/schema";
import {
  type DbExecutor,
  ensureBasicAuthUser,
} from "@/scripts/utils/ensure-basic-user";

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

interface FettmattisSeed {
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
const lastYear = currentYear - 1;
const devUserId = basicAuthUser.id;

// Date helpers for seeding: "old" records are from last year (>24h, no delete button)
// "current year" records use explicit current year dates for leaderboard visibility

// Explicit current year date that's always >24h ago (Jan 1st at midnight)
const currentYearStart = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0));

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
  // Last year rounds - for 24-hour deletion window test (no delete button)
  {
    key: "january_kickoff",
    id: "20000000-0000-4000-8000-000000000201",
    label: "January kickoff round",
    createdAt: new Date(Date.UTC(lastYear, 0, 5, 19, 30, 0)),
    participants: ["astrid", "emil", "lina"],
    loser: "emil",
    createdBy: devUserId,
  },
  {
    key: "midwinter_clash",
    id: "20000000-0000-4000-8000-000000000202",
    label: "Midwinter clash",
    createdAt: new Date(Date.UTC(lastYear, 0, 12, 22, 15, 0)),
    participants: ["astrid", "lina", "rex"],
    loser: "rex",
    createdBy: devUserId,
  },
  {
    key: "weekend_finale",
    id: "20000000-0000-4000-8000-000000000203",
    label: "Weekend finale",
    createdAt: new Date(Date.UTC(lastYear, 0, 18, 18, 45, 0)),
    participants: ["emil", "lina", "rex"],
    loser: "emil",
    createdBy: devUserId,
  },
  // Current year rounds - for leaderboard visibility (uses explicit current year dates)
  {
    key: "new_year_opener",
    id: "20000000-0000-4000-8000-000000000204",
    label: "New year opener",
    createdAt: currentYearStart,
    participants: ["astrid", "emil", "rex"],
    loser: "astrid",
    createdBy: devUserId,
  },
  {
    key: "winter_warmup",
    id: "20000000-0000-4000-8000-000000000205",
    label: "Winter warmup",
    createdAt: new Date(Date.UTC(currentYear, 0, 1, 1, 0, 0)),
    participants: ["lina", "rex", "zia"],
    loser: "lina",
    createdBy: devUserId,
  },
  {
    key: "midweek_match",
    id: "20000000-0000-4000-8000-000000000206",
    label: "Midweek match",
    createdAt: new Date(Date.UTC(currentYear, 0, 1, 2, 0, 0)),
    participants: ["astrid", "emil", "lina"],
    loser: "emil",
    createdBy: devUserId,
  },
];

const fettmattisSeeds: FettmattisSeed[] = [
  // Last year fettmattis - for 24-hour deletion window test (no delete button)
  {
    id: "30000000-0000-4000-8000-000000000301",
    player: "lina",
    round: "january_kickoff",
    createdAt: new Date(Date.UTC(lastYear, 0, 5, 20, 15, 0)),
    createdBy: devUserId,
  },
  {
    id: "30000000-0000-4000-8000-000000000302",
    player: "rex",
    round: "midwinter_clash",
    createdAt: new Date(Date.UTC(lastYear, 0, 12, 22, 45, 0)),
    createdBy: devUserId,
  },
  {
    id: "30000000-0000-4000-8000-000000000303",
    player: "astrid",
    round: null,
    createdAt: new Date(Date.UTC(lastYear, 0, 15, 18, 30, 0)),
    createdBy: devUserId,
  },
  // Current year fettmattis - for leaderboard visibility (uses explicit current year dates)
  // T037 expects Astrid and Lina in the Fettmattis table
  {
    id: "30000000-0000-4000-8000-000000000304",
    player: "astrid",
    round: "new_year_opener",
    createdAt: new Date(Date.UTC(currentYear, 0, 1, 0, 30, 0)),
    createdBy: devUserId,
  },
  {
    id: "30000000-0000-4000-8000-000000000305",
    player: "lina",
    round: "midweek_match",
    createdAt: new Date(Date.UTC(currentYear, 0, 1, 2, 30, 0)),
    createdBy: devUserId,
  },
];

async function seed(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be set before running the seed script.");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle({
    client: pool,
    schema,
    casing: "snake_case",
  });

  writeLine(process.stdout, "Starting database seed...");

  try {
    await db.transaction(async (tx) => {
      await resetTables(tx);
      await ensureBasicAuthUser(tx);
      writeLine(
        process.stdout,
        `Ensured basic auth user ${basicAuthUser.email}.`,
      );
      const players = await insertPlayers(tx);
      const rounds = await insertRounds(tx, players);
      await insertFettmattis(tx, players, rounds);
    });

    writeLine(process.stdout, "Database seed completed successfully.");
  } catch (error: unknown) {
    writeLine(process.stderr, `Database seed failed: ${formatError(error)}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

async function resetTables(client: DbExecutor): Promise<void> {
  writeLine(process.stdout, "Clearing existing data...");
  await client.delete(schema.fettmattis);
  await client.delete(schema.roundLoser);
  await client.delete(schema.roundParticipants);
  await client.delete(schema.rounds);
  await client.delete(schema.players);
  await client.delete(schema.sessions);
  await client.delete(schema.verifications);
  await client.delete(schema.accounts);
  await client.delete(schema.users);
}

async function insertPlayers(
  client: DbExecutor,
): Promise<Map<string, PlayerRecord>> {
  writeLine(process.stdout, "Inserting players...");
  const playerMap = new Map<string, PlayerRecord>();

  for (const player of playerSeeds) {
    const [created] = await client
      .insert(schema.players)
      .values({
        id: player.id,
        displayName: player.displayName,
        userId: player.userId ?? null,
        active: player.active ?? true,
      })
      .returning({
        id: schema.players.id,
        displayName: schema.players.displayName,
      });

    if (!created) {
      throw new Error(`Failed to insert player ${player.displayName}.`);
    }

    playerMap.set(player.key, {
      id: created.id,
      displayName: created.displayName,
    });

    writeLine(process.stdout, `  • ${player.displayName}`);
  }

  return playerMap;
}

async function insertRounds(
  client: DbExecutor,
  players: Map<string, PlayerRecord>,
): Promise<Map<string, RoundRecord>> {
  writeLine(process.stdout, "Recording rounds...");
  const roundsMap = new Map<string, RoundRecord>();

  for (const round of roundSeeds) {
    const participantIds = round.participants.map((key) => {
      const record = players.get(key);
      if (!record) {
        throw new Error(
          `Participant ${key} not found while seeding round ${round.key}.`,
        );
      }
      return record.id;
    });

    const loser = players.get(round.loser);
    if (!loser) {
      throw new Error(
        `Loser ${round.loser} not found while seeding round ${round.key}.`,
      );
    }

    await client.insert(schema.rounds).values({
      id: round.id,
      createdBy: round.createdBy,
      createdAt: round.createdAt,
      deletedAt: null,
    });

    await client.insert(schema.roundParticipants).values(
      participantIds.map((participantId) => ({
        roundId: round.id,
        playerId: participantId,
      })),
    );

    await client.insert(schema.roundLoser).values({
      roundId: round.id,
      loserId: loser.id,
    });

    roundsMap.set(round.key, { id: round.id });
    writeLine(process.stdout, `  • ${round.label}`);
  }

  return roundsMap;
}

async function insertFettmattis(
  client: DbExecutor,
  players: Map<string, PlayerRecord>,
  rounds: Map<string, RoundRecord>,
): Promise<void> {
  writeLine(process.stdout, "Awarding Fettmattis records...");

  for (const entry of fettmattisSeeds) {
    const player = players.get(entry.player);
    if (!player) {
      throw new Error(`Fettmattis player ${entry.player} not found.`);
    }

    const roundRecord = entry.round ? rounds.get(entry.round) : null;
    if (entry.round && !roundRecord) {
      throw new Error(`Fettmattis round ${entry.round} not found.`);
    }

    await client.insert(schema.fettmattis).values({
      id: entry.id,
      playerId: player.id,
      createdBy: entry.createdBy,
      createdAt: entry.createdAt,
      revokedAt: null,
    });

    writeLine(process.stdout, `  • ${player.displayName}`);
  }
}

await seed();
