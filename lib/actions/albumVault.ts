"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Normalizes a Spotify album object for database storage
 */
function normalizeSpotifyAlbum(spotifyAlbum: any) {
  return {
    id: spotifyAlbum.id,
    name: spotifyAlbum.name,
    artist_ids: spotifyAlbum.artists?.map((a: any) => a.id) || [],
    cover_url: spotifyAlbum.images?.[0]?.url || null,
  };
}

/**
 * Saves an album to the user's vault
 */
export async function saveAlbumToVault(spotifyAlbum: any) {
  const auditLog: any = {
    event: "Album Vault Write Attempt",
    timestamp: new Date().toISOString(),
    albumName: spotifyAlbum.name,
    spotifyId: spotifyAlbum.id,
  };

  console.log("--------------------------------------------------");
  console.log("ALBUM_VAULT: Audit Start", auditLog);

  try {
    const supabase = await createClient();

    // 1. Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("ALBUM_VAULT: Auth Failed", authError);
      return { success: false, error: "Unauthorized: Please log in", code: 401, debug: auditLog };
    }
    auditLog.userId = user.id;
    console.log("ALBUM_VAULT: Auth Verified", user.id);

    // 2. Normalize album data
    const album = normalizeSpotifyAlbum(spotifyAlbum);
    auditLog.normalizedData = { albumId: album.id };

    // 3. Upsert Album (ensure it exists in albums table)
    const { error: albumError } = await supabase
      .from("albums")
      .upsert(album, { onConflict: "id", ignoreDuplicates: true });

    if (albumError) {
      console.error("ALBUM_VAULT: Album Upsert Error", albumError);
      throw new Error(`Album Upsert Failed: ${albumError.message}`);
    }
    console.log("ALBUM_VAULT: Album Upserted");

    // 4. Insert into User Album Bank
    const { error: bankError } = await supabase
      .from("user_album_bank")
      .insert({ album_id: album.id, user_id: user.id });

    if (bankError) {
      if (bankError.code === "23505") {
        // Unique violation - already in vault
        console.log("ALBUM_VAULT: Album already in bank (Duplicate)");
      } else {
        console.error("ALBUM_VAULT: UserAlbumBank Insert Error", bankError);
        throw new Error(`Bank Insert Failed: ${bankError.message}`);
      }
    } else {
      console.log("ALBUM_VAULT: UserAlbumBank Inserted");
    }

    // 5. Rating is auto-created by trigger (trg_ensure_album_rating)
    console.log("ALBUM_VAULT: Rating will be initialized by trigger");

    // 6. Get vault count for prompting logic
    const { count } = await supabase
      .from("user_album_bank")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    console.log("ALBUM_VAULT: Success");
    console.log("--------------------------------------------------");

    revalidatePath("/library");
    revalidatePath("/rankings");

    return {
      success: true,
      albumId: album.id,
      canStartComparing: (count || 0) >= 2,
      debug: auditLog,
    };

  } catch (err: any) {
    console.error("ALBUM_VAULT: Critical Failure", err);
    console.log("--------------------------------------------------");
    return { success: false, error: err.message, debug: auditLog };
  }
}

/**
 * Removes an album from the user's vault
 */
export async function removeAlbumFromVault(albumId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_album_bank")
    .delete()
    .eq("album_id", albumId);

  if (error) throw error;

  revalidatePath("/library");
  revalidatePath("/rankings");
  return { success: true };
}

/**
 * Check if an album is in the user's vault
 */
export async function isAlbumInVault(albumId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabase
    .from("user_album_bank")
    .select("id")
    .eq("album_id", albumId)
    .eq("user_id", user.id)
    .single();

  return !!data;
}
