"use server";

import { createClient } from "@/lib/supabase/server";
import { normalizeSpotifyTrack } from "@/lib/utils/normalizeSpotify";
import { revalidatePath } from "next/cache";

export async function saveTrackToVault(spotifyTrack: any) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // 1. Normalize
  const { track, album } = normalizeSpotifyTrack(spotifyTrack);

  // 2. Upsert Album (Global)
  // We use admin/service role ideally, but RLS 'authenticated can insert' works if defined.
  // Using simple upsert.
  const { error: albumError } = await supabase
    .from("albums")
    .upsert(album, { onConflict: "id", ignoreDuplicates: true }); // Prefer existing metadata usually

  if (albumError) console.error("Album Upsert Error", albumError);

  // 3. Upsert Track (Global)
  const { error: trackError } = await supabase
    .from("tracks")
    .upsert(track, { onConflict: "id" });
  
  if (trackError) { 
     console.error("Track Upsert Error", trackError);
     throw new Error("Failed to save track metadata");
  }

  // 4. Insert into User Bank (Private)
  const { error: bankError } = await supabase
    .from("user_bank")
    .insert({ track_id: track.id })
    .select() // verify return
    .single();

  if (bankError) {
    // If unique violation, user already has it. Not a fatal error, but effectively "Saved"
    if (bankError.code !== "23505") {
       throw bankError;
    }
  }

  // 5. Initialize Rating (Private) - optional but helpful for fast onboarding
  // We don't error max on this, silently fail is ok
  await supabase
    .from("track_ratings")
    .upsert({ track_id: track.id, user_id: user.id, rating: 1500, games: 0 }, { onConflict: "track_id, user_id", ignoreDuplicates: true });

  revalidatePath("/vault");
  return { success: true };
}

export async function removeTrackFromVault(trackId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_bank")
    .delete()
    .eq("track_id", trackId);
  
  if(error) throw error;
  
  revalidatePath("/vault");
  return { success: true };
}
