import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ trackId: string }> },
) {
  const { trackId } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rhyme_queue')
    .select('id, spotify_track_id, status, progress_pct, error_message')
    .eq('spotify_track_id', trackId)
    .single();

  if (error || !data) {
    return NextResponse.json({ status: 'not_found' }, { status: 404 });
  }

  return NextResponse.json(data);
}
