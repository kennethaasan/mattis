
import { describe, it, expect, vi } from 'vitest';
import { getRegularLeaderboard, getFettmattisLeaderboard } from '@/lib/leaderboard';
import * as dbClient from '@/lib/db/db-client';

vi.mock('@/lib/db/db-client', () => ({
  getPlayers: vi.fn(),
  getRoundsByYear: vi.fn(),
  getFettmattisByYear: vi.fn(),
}));

describe('Leaderboard Logic', () => {
  it('calculates the regular leaderboard correctly', async () => {
    const players = [
      { id: '1', displayName: 'Player A' },
      { id: '2', displayName: 'Player B' },
    ];
    const rounds = [
      { round_participants: [{ playerId: '1' }, { playerId: '2' }], round_loser: { loserId: '1' } },
      { round_participants: [{ playerId: '1' }, { playerId: '2' }], round_loser: { loserId: '2' } },
      { round_participants: [{ playerId: '1' }], round_loser: { loserId: '1' } },
    ];

    vi.mocked(dbClient.getPlayers).mockResolvedValue(players as any);
    vi.mocked(dbClient.getRoundsByYear).mockResolvedValue(rounds as any);

    const leaderboard = await getRegularLeaderboard(2024);

    expect(leaderboard).toEqual([
      {
        playerId: '1',
        playerName: 'Player A',
        totalLosses: 2,
        roundsPlayed: 3,
        lossPercentage: (2 / 3) * 100,
      },
      {
        playerId: '2',
        playerName: 'Player B',
        totalLosses: 1,
        roundsPlayed: 2,
        lossPercentage: (1 / 2) * 100,
      },
    ]);
  });

  it('calculates the fettmattis leaderboard correctly', async () => {
    const players = [
      { id: '1', displayName: 'Player A' },
      { id: '2', displayName: 'Player B' },
    ];
    const fettmattis = [
      { playerId: '1' },
      { playerId: '1' },
      { playerId: '2' },
    ];

    vi.mocked(dbClient.getPlayers).mockResolvedValue(players as any);
    vi.mocked(dbClient.getFettmattisByYear).mockResolvedValue(fettmattis as any);

    const leaderboard = await getFettmattisLeaderboard(2024);

    expect(leaderboard).toEqual([
      {
        playerId: '1',
        playerName: 'Player A',
        fettmattisCount: 2,
      },
      {
        playerId: '2',
        playerName: 'Player B',
        fettmattisCount: 1,
      },
    ]);
  });
});
