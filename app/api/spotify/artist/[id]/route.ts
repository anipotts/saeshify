import { getClientCredentialsToken } from '@/lib/spotify/auth';
import { SPOTIFY_API_BASE } from '@/lib/spotify/config';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Artist ID required' }, { status: 400 });
  }

  const tokenData = await getClientCredentialsToken();
  if ("error" in tokenData) {
    return NextResponse.json({ error: tokenData.error }, { status: tokenData.status || 500 });
  }

  const token = tokenData.access_token;

  try {
      // Parallel Fetch: Artist Info, Top Tracks, Albums
      const [artistRes, topTracksRes, albumsRes] = await Promise.all([
          fetch(`${SPOTIFY_API_BASE}/artists/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${SPOTIFY_API_BASE}/artists/${id}/top-tracks?market=US`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${SPOTIFY_API_BASE}/artists/${id}/albums?include_groups=album,single&market=US&limit=20`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (!artistRes.ok) throw new Error("Failed to fetch artist");
      
      const artist = await artistRes.json();
      const topTracks = await topTracksRes.json();
      const albums = await albumsRes.json();

      return NextResponse.json({
          artist,
          top_tracks: topTracks.tracks,
          albums: albums.items
      });
  } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
