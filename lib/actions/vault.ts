"use server";

import { createClient } from "@/lib/supabase/server";
import { normalizeSpotifyTrack } from "@/lib/utils/normalizeSpotify";
import { revalidatePath } from "next/cache";

export async function saveTrackToVault(spotifyTrack: any) {
  const auditLog: any = { 
    event: "Vault Write Attempt", 
    timestamp: new Date().toISOString(), 
    trackName: spotifyTrack.name, 
    spotifyId: spotifyTrack.id 
  };
  
  console.log("--------------------------------------------------");
  console.log("VAULT: Audit Start", auditLog);

  try {
    const supabase = await createClient();
    
    // 1. Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("VAULT: Auth Failed", authError);
      return { success: false, error: "Unauthorized: Please log in in Settings", code: 401, debug: auditLog };
    }
    auditLog.userId = user.id;
    console.log("VAULT: Auth Verified", user.id);

    // 2. Normalize
    const { track, album } = normalizeSpotifyTrack(spotifyTrack);
    auditLog.normalizedData = { trackId: track.id, albumId: album.id };

    // 3. Upsert Album
    // We attempt upsert. If it fails due to simple race condition, we retry once or just proceed if it exists.
    const { error: albumError } = await supabase
      .from("albums")
      .upsert(album, { onConflict: "id", ignoreDuplicates: true }); 
    
    if (albumError) {
       console.error("VAULT: Album Upsert Error", albumError);
       // We log but might not throw if we want to try track insert anyway (though likely will fail FK)
       // Let's throw to ensure "Atomic" feeling success
       throw new Error(`Album Upsert Failed: ${albumError.message}`);
    }
    console.log("VAULT: Album Upserted");

    // 4. Upsert Track
    const { error: trackError } = await supabase
      .from("tracks")
      .upsert(track, { onConflict: "id" });
    
    if (trackError) { 
       console.error("VAULT: Track Upsert Error", trackError);
       throw new Error(`Track Upsert Failed: ${trackError.message}`);
    }
    console.log("VAULT: Track Upserted");

    // 5. Insert into User Bank
    // Check if already exists to distinguish "Added" vs "Already in Vault"
    const { error: bankError } = await supabase
      .from("user_bank")
      .insert({ track_id: track.id, user_id: user.id });

    if (bankError) {
      if (bankError.code === "23505") { // Unique violation
         console.log("VAULT: Track already in bank (Duplicate)");
         // Not an error, just idempotent success
      } else {
         console.error("VAULT: UserBank Insert Error", bankError);
         throw new Error(`Bank Insert Failed: ${bankError.message}`);
      }
    } else {
      console.log("VAULT: UserBank Inserted");
    }

    // 6. Initialize Rating
    const { error: ratingError } = await supabase
      .from("track_ratings")
      .upsert({ 
          track_id: track.id, 
          user_id: user.id, 
          rating: 1500, 
          games: 0 
      }, { onConflict: "track_id, user_id", ignoreDuplicates: true });

    if (ratingError) {
       console.error("VAULT: Rating Init Error", ratingError);
       // Non-blocking, but good to know
    }
    console.log("VAULT: Rating Initialized");

    console.log("VAULT: Success");
    console.log("--------------------------------------------------");
    
    revalidatePath("/vault");
    revalidatePath("/"); // Update search results "plus" icons potentially
    
    return { success: true, debug: auditLog };

  } catch (err: any) {
    console.error("VAULT: Critical Failure", err);
    console.log("--------------------------------------------------");
    return { success: false, error: err.message, debug: auditLog };
  }
}

export async function removeTrackFromVault(trackId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_bank")
    .delete()
    .eq("track_id", trackId);
  
  if(error) throw error;
  
  revalidatePath("/vault");
  return { success: true };
}
