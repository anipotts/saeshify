import { describe, it, expect } from 'vitest';

/**
 * Tests for the Elo algorithm used by Saeshify's ranking system.
 * The actual calculation happens in the Supabase RPC (record_comparison / record_album_comparison),
 * but we replicate the math here to verify correctness.
 */

// Elo calculation as implemented in the Supabase RPC
function calculateElo(
  winnerRating: number,
  loserRating: number,
  winnerGames: number,
  loserGames: number
): { winnerNewRating: number; loserNewRating: number } {
  // K-factor based on games played
  const getK = (games: number): number => {
    if (games < 5) return 64;  // Placement
    if (games < 20) return 32; // Adjustment
    return 16;                  // Stable
  };

  const kWinner = getK(winnerGames);
  const kLoser = getK(loserGames);

  // Expected scores
  const expectedWinner = 1.0 / (1.0 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser = 1.0 / (1.0 + Math.pow(10, (winnerRating - loserRating) / 400));

  // New ratings
  const winnerNewRating = winnerRating + kWinner * (1.0 - expectedWinner);
  const loserNewRating = loserRating + kLoser * (0.0 - expectedLoser);

  return { winnerNewRating, loserNewRating };
}

// Pair key generation (used in matchmaking)
function getPairKey(id1: string, id2: string): string {
  return [id1, id2].sort().join(':');
}

describe('Elo Algorithm', () => {
  describe('K-factor determination', () => {
    it('uses K=64 for placement phase (< 5 games)', () => {
      const { winnerNewRating } = calculateElo(1500, 1500, 0, 0);
      // With equal ratings and K=64: change = 64 * (1 - 0.5) = 32
      expect(Math.round(winnerNewRating)).toBe(1532);
    });

    it('uses K=32 for adjustment phase (5-19 games)', () => {
      const { winnerNewRating } = calculateElo(1500, 1500, 10, 10);
      // With equal ratings and K=32: change = 32 * (1 - 0.5) = 16
      expect(Math.round(winnerNewRating)).toBe(1516);
    });

    it('uses K=16 for stable phase (20+ games)', () => {
      const { winnerNewRating } = calculateElo(1500, 1500, 25, 25);
      // With equal ratings and K=16: change = 16 * (1 - 0.5) = 8
      expect(Math.round(winnerNewRating)).toBe(1508);
    });
  });

  describe('Rating changes', () => {
    it('winner gains and loser loses rating', () => {
      const { winnerNewRating, loserNewRating } = calculateElo(1500, 1500, 10, 10);
      expect(winnerNewRating).toBeGreaterThan(1500);
      expect(loserNewRating).toBeLessThan(1500);
    });

    it('equal ratings produce symmetric changes with same K', () => {
      const { winnerNewRating, loserNewRating } = calculateElo(1500, 1500, 10, 10);
      const winnerGain = winnerNewRating - 1500;
      const loserLoss = 1500 - loserNewRating;
      expect(Math.abs(winnerGain - loserLoss)).toBeLessThan(0.01);
    });

    it('upset victory (lower rated beats higher) produces bigger change', () => {
      const { winnerNewRating: upsetGain } = calculateElo(1300, 1700, 10, 10);
      const { winnerNewRating: normalGain } = calculateElo(1700, 1300, 10, 10);

      // Upset: 1300 beating 1700 should gain more than 1700 beating 1300
      expect(upsetGain - 1300).toBeGreaterThan(normalGain - 1700);
    });

    it('expected victory (higher rated beats lower) produces smaller change', () => {
      const { winnerNewRating } = calculateElo(1800, 1200, 10, 10);
      const gain = winnerNewRating - 1800;
      // Expected score is high (~0.97), so gain is small: K * (1 - 0.97) ≈ 1
      expect(gain).toBeLessThan(5);
    });

    it('ratings cannot go negative with extreme differences', () => {
      const { loserNewRating } = calculateElo(2000, 100, 0, 0);
      // Even with K=64, the loser should not drop below 0 for reasonable inputs
      // (In practice the expected score is ~0 so loss ≈ K*0 ≈ 0)
      expect(loserNewRating).toBeGreaterThan(0);
    });

    it('handles asymmetric K-factors (placement vs stable)', () => {
      const { winnerNewRating, loserNewRating } = calculateElo(1500, 1500, 2, 25);
      const winnerGain = winnerNewRating - 1500;
      const loserLoss = 1500 - loserNewRating;

      // Winner has K=64, loser has K=16
      // Winner should gain more than loser loses
      expect(winnerGain).toBeGreaterThan(loserLoss);
    });
  });

  describe('Convergence behavior', () => {
    it('repeated wins converge rating upward', () => {
      let rating = 1500;
      const opponentRating = 1500;

      for (let i = 0; i < 20; i++) {
        const games = i;
        const { winnerNewRating } = calculateElo(rating, opponentRating, games, games);
        rating = winnerNewRating;
      }

      expect(rating).toBeGreaterThan(1700);
    });

    it('alternating wins stabilize near starting rating', () => {
      let ratingA = 1500;
      let ratingB = 1500;

      for (let i = 0; i < 50; i++) {
        if (i % 2 === 0) {
          const result = calculateElo(ratingA, ratingB, i, i);
          ratingA = result.winnerNewRating;
          ratingB = result.loserNewRating;
        } else {
          const result = calculateElo(ratingB, ratingA, i, i);
          ratingB = result.winnerNewRating;
          ratingA = result.loserNewRating;
        }
      }

      // Both should stay near 1500
      expect(Math.abs(ratingA - 1500)).toBeLessThan(50);
      expect(Math.abs(ratingB - 1500)).toBeLessThan(50);
    });
  });
});

describe('Pair Key Generation', () => {
  it('produces consistent keys regardless of argument order', () => {
    expect(getPairKey('abc', 'def')).toBe(getPairKey('def', 'abc'));
  });

  it('sorts IDs alphabetically', () => {
    expect(getPairKey('z', 'a')).toBe('a:z');
  });

  it('uses colon as separator', () => {
    const key = getPairKey('track1', 'track2');
    expect(key).toContain(':');
    expect(key.split(':').length).toBe(2);
  });
});
