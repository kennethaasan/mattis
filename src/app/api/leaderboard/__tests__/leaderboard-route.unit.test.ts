import type { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as dbClient from '../../../../lib/db-client';
import { GET } from '../route';

function makeRequest(url: string) {
  return new Request(url);
}

describe('GET /api/leaderboard', () => {
  const sampleRows: Array<{ player_id: string; display_name: string; score: number }> = [
    { player_id: 'p1', display_name: 'Alice', score: 10 },
    { player_id: 'p2', display_name: 'Bob', score: 8 },
  ];

  beforeEach(() => {
    vi.spyOn(dbClient, 'queryLeaderboard').mockResolvedValue(sampleRows);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns leaderboard data', async () => {
    const req = makeRequest('http://localhost/api/leaderboard');
    const res = await GET(req as unknown as NextRequest);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toHaveProperty('data');
    expect(json.data).toHaveLength(2);
    expect(json.data[0]).toEqual({ playerId: 'p1', displayName: 'Alice', score: 10 });
  });

  it('accepts year and limit params', async () => {
    const req = makeRequest('http://localhost/api/leaderboard?year=2025&limit=1');
    const res = await GET(req as unknown as NextRequest);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
  });

  it('returns 400 for invalid query', async () => {
    const req = makeRequest('http://localhost/api/leaderboard?year=20ab');
    const res = await GET(req as unknown as NextRequest);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json).toHaveProperty('error');
  });

  it('returns 500 when db client throws', async () => {
    vi.spyOn(dbClient, 'queryLeaderboard').mockRejectedValueOnce(new Error('boom'));
    const req = makeRequest('http://localhost/api/leaderboard');
    const res = await GET(req as unknown as NextRequest);
    const json = await res.json();
    expect(res.status).toBe(500);
    expect(json).toHaveProperty('error');
  });
});
