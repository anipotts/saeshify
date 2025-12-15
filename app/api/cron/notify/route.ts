import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPushNotification } from "@/lib/push/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Get unique subscribers
  const { data: subs, error } = await supabaseAdmin.from("push_subscriptions").select("user_id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!subs || subs.length === 0) return NextResponse.json({ message: "No subscribers" });

  const uniqueUsers = Array.from(new Set(subs.map(s => s.user_id)));
  const results = [];

  for (const userId of uniqueUsers) {
      try {
          // Get last 24h history
          const { data: events } = await supabaseAdmin
            .from("listening_events")
            .select("*")
            .eq("user_id", userId)
            .gte("played_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // 24h ago

          if (!events || events.length === 0) {
              results.push({ userId, status: "no_data" });
              continue;
          }

          // Logic: 3x Repeats of same track
          const counts: Record<string, number> = {};
          const tracks: Record<string, any> = {};

          for (const e of events) {
              counts[e.track_spotify_id] = (counts[e.track_spotify_id] || 0) + 1;
              tracks[e.track_spotify_id] = e;
          }

          // Find track with >= 3 plays
          const topTrackId = Object.keys(counts).find(id => counts[id] >= 3);
          
          if (topTrackId) {
              const track = tracks[topTrackId];
              await sendPushNotification(userId, {
                  title: `On Repeat: ${track.track_name}`,
                  body: `You've played this ${counts[topTrackId]} times recently. Add it to your vault?`,
                  url: `/vault` 
              });
              results.push({ userId, status: "sent_repeat", track: track.track_name });
              continue; // Limit 1 push per run
          }
          
          // Logic: Artist Binge (3 distinct tracks same artist)
          const artists: Record<string, Set<string>> = {};
          for (const e of events) {
              if (!artists[e.artist_name]) artists[e.artist_name] = new Set();
              artists[e.artist_name].add(e.track_spotify_id);
          }
          
          const bingeArtist = Object.keys(artists).find(a => artists[a].size >= 3);
          if (bingeArtist) {
              await sendPushNotification(userId, {
                  title: `${bingeArtist} Binge?`,
                  body: `You listened to ${artists[bingeArtist].size} tracks by ${bingeArtist}. Check their top songs.`,
                  url: `/search?q=${encodeURIComponent(bingeArtist)}`
              });
              results.push({ userId, status: "sent_binge", artist: bingeArtist });
          } else {
              results.push({ userId, status: "no_pattern" });
          }

      } catch (e: any) {
          console.error(`Notify failed for ${userId}:`, e);
          results.push({ userId, error: e.message });
      }
  }

  return NextResponse.json({ success: true, results });
}
