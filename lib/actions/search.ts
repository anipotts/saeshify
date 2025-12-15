"use server";

import { createClient } from "@/lib/supabase/server";

export async function logSearch(payload: {
  kind: "track" | "album" | "artist";
  query: string;
  spotify_id: string;
  data: any; // visual payload
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return; // Silent fail allowed for logging

  // Create simplified payload to save DB space
  const minimalData = {
    name: payload.data.name,
    image: payload.data.album?.images?.[0]?.url || payload.data.images?.[0]?.url,
    subtitle: payload.data.artists?.[0]?.name || "Artist",
  };

  await supabase.from("recent_searches").upsert(
    {
      user_id: user.id,
      kind: payload.kind,
      spotify_id: payload.spotify_id,
      query: payload.query,
      payload: minimalData,
      last_seen_at: new Date().toISOString(),
      // We can use a trick to increment seen_count
      // But simple upsert overwrite is fine for now MVP, we just want 'recent' time
    },
    { onConflict: "user_id, kind, spotify_id" }
  );
}
