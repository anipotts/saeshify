import { getClientCredentialsToken } from '@/lib/spotify/auth';
import { SPOTIFY_API_BASE } from '@/lib/spotify/config';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "Query parameter required" }, { status: 400 });
  }

  const tokenData = await getClientCredentialsToken();
  if ("error" in tokenData) {
    return NextResponse.json({ error: tokenData.error }, { status: tokenData.status || 500 });
  }

  const url = `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(q)}&type=track,artist,album&limit=20&market=US`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }
  return NextResponse.json(data);
}
