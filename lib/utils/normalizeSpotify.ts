// Utility to ensure we always have the same shape for DB insertion
// Handles strict typing and optional chaining safety

export function normalizeSpotifyTrack(track: any) {
  // Extract Album
  const album = {
    id: track.album.id,
    name: track.album.name,
    artist_ids: track.album.artists.map((a: any) => a.id),
    cover_url: track.album.images?.[0]?.url || null,
  };

  // Extract Artists (Primary)
  const artistIds = track.artists.map((a: any) => a.id);

  // Extract Track
  const normalizedTrack = {
    id: track.id,
    name: track.name,
    album_id: track.album.id,
    artist_ids: artistIds,
    cover_url: track.album.images?.[0]?.url || null, // Denormalized for speed
    preview_url: track.preview_url || null,
    duration_ms: track.duration_ms,
  };

  return {
    track: normalizedTrack,
    album,
    artistIds, // Just IDs for now, we don't store full artist row in this schema version (yet)
  };
}
