import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ trackId: string }> },
) {
  const { trackId } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rhyme_analyses')
    .select('*')
    .eq('spotify_track_id', trackId)
    .single();

  if (error || !data) {
    return NextResponse.json({ status: 'not_found' }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ trackId: string }> },
) {
  const { trackId } = await params;
  const body = await request.json().catch(() => ({}));

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('enqueue_rhyme_analysis', {
    p_spotify_track_id: trackId,
    p_isrc: body.isrc || null,
    p_artist: body.artist || null,
    p_title: body.title || null,
    p_priority: body.priority ?? 0,
    p_requested_by: 'user',
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ result: data });
}
