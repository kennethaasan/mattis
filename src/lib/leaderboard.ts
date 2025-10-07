import { db } from './db/db-client';
import { sql } from 'drizzle-orm';

export const getRegularLeaderboard = async (year: number) => {
  const result = await db.execute(sql`
    WITH player_participation AS (
      SELECT
        p.id AS player_id,
        p.display_name,
        COUNT(rp.round_id) AS participation_count
      FROM players p
      JOIN round_participants rp ON p.id = rp.player_id
      JOIN rounds r ON rp.round_id = r.id
      WHERE EXTRACT(YEAR FROM r.created_at) = ${year}
      GROUP BY p.id, p.display_name
    ),
    player_losses AS (
      SELECT
        p.id AS player_id,
        COUNT(rl.round_id) AS loss_count
      FROM players p
      JOIN round_loser rl ON p.id = rl.loser_id
      JOIN rounds r ON rl.round_id = r.id
      WHERE EXTRACT(YEAR FROM r.created_at) = ${year}
      GROUP BY p.id
    )
    SELECT
      pp.player_id,
      pp.display_name,
      pp.participation_count,
      COALESCE(pl.loss_count, 0) AS loss_count,
      (COALESCE(pl.loss_count, 0) * 100.0 / pp.participation_count) AS loss_percentage
    FROM player_participation pp
    LEFT JOIN player_losses pl ON pp.player_id = pl.player_id
    ORDER BY loss_percentage ASC, loss_count ASC, pp.display_name ASC;
  `);

  return result;
};

export const getFettmattisLeaderboard = async (year: number) => {
    const result = await db.execute(sql`
        SELECT
            p.id AS player_id,
            p.display_name,
            COUNT(f.id) AS fettmattis_count
        FROM players p
        JOIN fettmattis f ON p.id = f.player_id
        WHERE EXTRACT(YEAR FROM f.created_at) = ${year} AND f.revoked_at IS NULL
        GROUP BY p.id, p.display_name
        ORDER BY fettmattis_count DESC, p.display_name ASC;
    `);

    return result;
};
