import { describe, it, expect } from 'vitest';

/**
 * Tests for album vault normalization logic.
 * The actual server actions require Supabase, so we test the pure functions.
 */

// Replicate normalizeSpotifyAlbum from albumVault.ts
function normalizeSpotifyAlbum(spotifyAlbum: any) {
  return {
    id: spotifyAlbum.id,
    name: spotifyAlbum.name,
    artist_ids: spotifyAlbum.artists?.map((a: any) => a.id) || [],
    cover_url: spotifyAlbum.images?.[0]?.url || null,
  };
}

describe('normalizeSpotifyAlbum', () => {
  it('extracts id and name', () => {
    const result = normalizeSpotifyAlbum({
      id: '6dVIqQ8qmQ5GBnJ9shOYGE',
      name: 'OK Computer',
      artists: [{ id: '4Z8W4fKeB5YxbusRsdQVPb', name: 'Radiohead' }],
      images: [{ url: 'https://i.scdn.co/image/abc', height: 640, width: 640 }],
    });

    expect(result.id).toBe('6dVIqQ8qmQ5GBnJ9shOYGE');
    expect(result.name).toBe('OK Computer');
  });

  it('extracts artist IDs as array', () => {
    const result = normalizeSpotifyAlbum({
      id: 'test',
      name: 'Collab Album',
      artists: [
        { id: 'artist1', name: 'Artist One' },
        { id: 'artist2', name: 'Artist Two' },
      ],
      images: [],
    });

    expect(result.artist_ids).toEqual(['artist1', 'artist2']);
  });

  it('uses first image URL for cover', () => {
    const result = normalizeSpotifyAlbum({
      id: 'test',
      name: 'Test',
      artists: [],
      images: [
        { url: 'https://large.jpg', height: 640, width: 640 },
        { url: 'https://small.jpg', height: 64, width: 64 },
      ],
    });

    expect(result.cover_url).toBe('https://large.jpg');
  });

  it('handles missing images gracefully', () => {
    const result = normalizeSpotifyAlbum({
      id: 'test',
      name: 'No Art',
      artists: [],
    });

    expect(result.cover_url).toBeNull();
  });

  it('handles missing artists gracefully', () => {
    const result = normalizeSpotifyAlbum({
      id: 'test',
      name: 'Solo',
    });

    expect(result.artist_ids).toEqual([]);
  });

  it('handles empty images array', () => {
    const result = normalizeSpotifyAlbum({
      id: 'test',
      name: 'Test',
      artists: [],
      images: [],
    });

    expect(result.cover_url).toBeNull();
  });
});
