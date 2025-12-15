"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function recordRecentSearch(item: {
  kind: 'track' | 'album' | 'artist' | 'query';
  query: string; // Title / Name
  spotify_id: string; // ID
  payload?: any;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return; // Silent fail if not logged in

  // Payload: Sanitize or just store what we need (image, subtitle)
  // We prefer lightweight payload.
  const cleanPayload = {
      subtitle: item.payload?.subtitle || item.payload?.artist_name || "",
      image: item.payload?.image || item.payload?.cover_url || item.payload?.images?.[0]?.url || "",
      artist_names: item.payload?.artist_names || [],
  };

  const { error } = await supabase
    .from("recent_searches")
    .upsert({
      user_id: user.id,
      kind: item.kind,
      query: item.query,
      spotify_id: item.spotify_id,
      payload: cleanPayload,
      last_seen_at: new Date().toISOString(),
      seen_count: 1 // If conflict, we might want to increment, but upsert with just ID might replace. 
                   // To increment on conflict, we'd need more complex query or trigger. 
                   // For now, refreshing 'last_seen_at' is enough to bring to top.
    }, { onConflict: "user_id, kind, spotify_id" });

  if (error) {
    console.error("RECENTS: Failed to save", error);
  } else {
    revalidatePath("/"); // Optional: revalidate search if we show recents there
  }
}

export async function getRecentSearches() {
  const supabase = await createClient();
   const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("recent_searches")
    .select("*")
    .eq("user_id", user.id)
    .order("last_seen_at", { ascending: false })
    .limit(20);

  if (!data) return [];
  
  // Transform to fit Sidebar RecentItem interface
  return data.map((d: any) => ({
      id: d.id,
      type: d.kind,
      title: d.query,
      subtitle: d.payload?.subtitle || "",
      image: d.payload?.image || "",
      data: { ...d.payload, id: d.spotify_id } // Reconstruct partial payload
  }));
}
