import { describe, it, expect } from 'vitest';
import type { RankedTrack, RankedAlbum, Matchup, AlbumMatchup, VoteResult } from '@/lib/ranking/types';

describe('Ranking Types', () => {
  it('RankedTrack has required fields', () => {
    const track: RankedTrack = {
      id: 'abc123',
      name: 'Test Track',
      cover_url: 'https://example.com/cover.jpg',
      rating: 1500,
      games: 0,
    };
    expect(track.id).toBe('abc123');
    expect(track.rating).toBe(1500);
    expect(track.games).toBe(0);
  });

  it('RankedAlbum has required fields', () => {
    const album: RankedAlbum = {
      id: 'album123',
      name: 'Test Album',
      cover_url: 'https://example.com/cover.jpg',
      rating: 1500,
      games: 0,
    };
    expect(album.id).toBe('album123');
    expect(album.rating).toBe(1500);
  });

  it('Matchup contains two tracks with a pairKey', () => {
    const matchup: Matchup = {
      id: 'abc:def',
      trackA: { id: 'abc', name: 'Track A', cover_url: null, rating: 1500, games: 0 },
      trackB: { id: 'def', name: 'Track B', cover_url: null, rating: 1500, games: 0 },
    };
    expect(matchup.id).toBe('abc:def');
    expect(matchup.trackA.id).not.toBe(matchup.trackB.id);
  });

  it('AlbumMatchup contains two albums with a pairKey', () => {
    const matchup: AlbumMatchup = {
      id: 'alb1:alb2',
      albumA: { id: 'alb1', name: 'Album A', cover_url: null, rating: 1500, games: 0 },
      albumB: { id: 'alb2', name: 'Album B', cover_url: null, rating: 1500, games: 0 },
    };
    expect(matchup.id).toBe('alb1:alb2');
    expect(matchup.albumA.id).not.toBe(matchup.albumB.id);
  });

  it('VoteResult contains winner/loser with new ratings', () => {
    const result: VoteResult = {
      winnerId: 'abc',
      loserId: 'def',
      winnerNewRating: 1532,
      loserNewRating: 1468,
    };
    expect(result.winnerNewRating).toBeGreaterThan(result.loserNewRating);
  });
});
