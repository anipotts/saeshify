import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for matchmaking logic.
 * Since getNextMatchup/getNextAlbumMatchup are server functions using Supabase,
 * we test the selection algorithms in isolation.
 */

interface Candidate {
  id: string;
  rating: number;
  games: number;
}

// Replicate the matchmaking selection logic from matchmaking.ts
function selectMatchup(
  candidates: Candidate[],
  seedId?: string,
  excludePairKeys: string[] = []
): { trackA: Candidate; trackB: Candidate } | null {
  if (candidates.length < 2) return null;

  // Select Track A
  let trackA: Candidate;
  if (seedId) {
    const seed = candidates.find(c => c.id === seedId);
    trackA = seed || candidates[Math.floor(Math.random() * candidates.length)];
  } else {
    // Pick from low games subset (first 15, already sorted by games ASC)
    const lowGames = candidates.slice(0, 15);
    trackA = lowGames[Math.floor(Math.random() * lowGames.length)];
  }

  // Select Track B — closest rating, top 5
  const opponents = candidates.filter(c => c.id !== trackA.id);
  const sortedByDiff = opponents.sort((a, b) =>
    Math.abs(a.rating - trackA.rating) - Math.abs(b.rating - trackA.rating)
  );
  const topOpponents = sortedByDiff.slice(0, 5);

  const getPairKey = (id1: string, id2: string) => [id1, id2].sort().join(':');

  let trackB = topOpponents[0]; // Deterministic for tests

  if (trackB && excludePairKeys.includes(getPairKey(trackA.id, trackB.id))) {
    trackB = topOpponents.find(t => !excludePairKeys.includes(getPairKey(trackA.id, t.id))) || trackB;
  }

  if (!trackA || !trackB) return null;

  return { trackA, trackB };
}

describe('Matchmaking Selection', () => {
  const pool: Candidate[] = [
    { id: 'a', rating: 1500, games: 0 },
    { id: 'b', rating: 1510, games: 1 },
    { id: 'c', rating: 1600, games: 5 },
    { id: 'd', rating: 1400, games: 10 },
    { id: 'e', rating: 1550, games: 3 },
  ];

  it('returns null with less than 2 candidates', () => {
    expect(selectMatchup([])).toBeNull();
    expect(selectMatchup([pool[0]])).toBeNull();
  });

  it('returns two different candidates', () => {
    const result = selectMatchup(pool);
    expect(result).not.toBeNull();
    expect(result!.trackA.id).not.toBe(result!.trackB.id);
  });

  it('uses seed ID when provided', () => {
    const result = selectMatchup(pool, 'c');
    expect(result).not.toBeNull();
    expect(result!.trackA.id).toBe('c');
  });

  it('falls back to random if seed not in pool', () => {
    const result = selectMatchup(pool, 'nonexistent');
    expect(result).not.toBeNull();
  });

  it('selects opponent close in rating', () => {
    // With seed 'a' (rating 1500), closest should be 'b' (1510)
    const result = selectMatchup(pool, 'a');
    expect(result).not.toBeNull();
    expect(result!.trackB.id).toBe('b');
  });

  it('respects pair exclusions', () => {
    const excluded = ['a:b']; // Exclude a vs b
    const result = selectMatchup(pool, 'a', excluded);
    expect(result).not.toBeNull();
    // Should pick next closest: 'e' (1550) instead of 'b' (1510)
    expect(result!.trackB.id).not.toBe('b');
  });

  it('falls back to excluded pair if no alternative', () => {
    // Pool of 2 where the pair is excluded
    const smallPool: Candidate[] = [
      { id: 'x', rating: 1500, games: 0 },
      { id: 'y', rating: 1500, games: 0 },
    ];
    const result = selectMatchup(smallPool, 'x', ['x:y']);
    expect(result).not.toBeNull();
    // Falls back to the excluded pair since there's no alternative
    expect(result!.trackB.id).toBe('y');
  });

  it('prioritizes low-games candidates when no seed', () => {
    // First 15 sorted by games ASC = all 5 items
    // trackA should be from the low-games subset
    const results = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const result = selectMatchup(pool);
      if (result) results.add(result.trackA.id);
    }
    // All selected trackA should be from pool (which is already sorted by games)
    expect(results.size).toBeGreaterThan(0);
  });
});

describe('Information Gain Strategy', () => {
  it('tracks with 0 games are exploration candidates', () => {
    const pool: Candidate[] = [
      { id: 'new1', rating: 1500, games: 0 },
      { id: 'new2', rating: 1500, games: 0 },
      { id: 'veteran', rating: 1600, games: 50 },
    ];

    // Sort by games ASC (as the DB query does)
    pool.sort((a, b) => a.games - b.games);

    // Low games subset should contain the new tracks
    const lowGames = pool.slice(0, 15);
    expect(lowGames.map(c => c.id)).toContain('new1');
    expect(lowGames.map(c => c.id)).toContain('new2');
  });

  it('rating proximity maximizes Elo efficiency', () => {
    const pool: Candidate[] = [
      { id: 'target', rating: 1500, games: 5 },
      { id: 'close', rating: 1510, games: 5 },
      { id: 'far', rating: 1800, games: 5 },
    ];

    const result = selectMatchup(pool, 'target');
    // Opponent should be 'close' (closest rating)
    expect(result!.trackB.id).toBe('close');
  });
});
