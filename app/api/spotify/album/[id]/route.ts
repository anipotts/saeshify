import { getClientCredentialsToken } from '@/lib/spotify/auth';
import { SPOTIFY_API_BASE } from '@/lib/spotify/config';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Album ID required' }, { status: 400 });
  }

  const tokenData = await getClientCredentialsToken();
  if ("error" in tokenData) {
    return NextResponse.json({ error: tokenData.error }, { status: tokenData.status || 500 });
  }

  const res = await fetch(`${SPOTIFY_API_BASE}/albums/${id}`, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }
  return NextResponse.json(data);
}
