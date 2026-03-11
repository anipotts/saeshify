import { NextResponse } from 'next/server';
import { getValidAccessToken } from '@/lib/spotify/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  // Get current user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const token = await getValidAccessToken(user.id);
  if (!token) {
    return NextResponse.json({ error: 'No Spotify token' }, { status: 401 });
  }

  const res = await fetch('https://api.spotify.com/v1/me/player', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 204) {
    return NextResponse.json({ is_playing: false, track: null, progress_ms: 0 });
  }

  if (!res.ok) {
    return NextResponse.json({ error: 'Spotify API error' }, { status: res.status });
  }

  const data = await res.json();

  return NextResponse.json({
    is_playing: data.is_playing,
    progress_ms: data.progress_ms,
    track: data.item
      ? {
          id: data.item.id,
          name: data.item.name,
          artist: data.item.artists?.[0]?.name,
          album: data.item.album?.name,
          cover: data.item.album?.images?.[0]?.url,
          duration_ms: data.item.duration_ms,
          isrc: data.item.external_ids?.isrc,
        }
      : null,
  });
}
