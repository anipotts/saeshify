import { createClient } from "@supabase/supabase-js";

// Init Admin Client (Service Role)
// NOTE: This MUST NOT be called on client-side.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

/**
 * Ensures we have a valid access token for the user.
 * Refreshes if expired.
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  // 1. Get Tokens from DB
  const { data: tokens, error } = await supabaseAdmin
    .from("spotify_tokens")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !tokens) {
    console.error("Spotify Token Error:", error);
    return null;
  }

  // 2. Check Expiry (Buffer 60s)
  const expiresAt = new Date(tokens.expires_at).getTime();
  const now = Date.now();
  if (expiresAt > now + 60 * 1000) {
    return tokens.access_token;
  }

  // 3. Refresh Token
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      console.error("Missing Spotify Client Creds in Env");
      return null;
  }

  try {
      const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");
      const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Authorization": `Basic ${basic}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: tokens.refresh_token
        })
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Spotify Refresh Failed:", err);
        // If "invalid_grant" (revoked), should we delete the row? 
        // For now, return null, effectively logging them out of this feature.
        return null;
      }

      const refreshed = await res.json();
      
      // Update DB
      const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
      await supabaseAdmin.from("spotify_tokens").update({
          access_token: refreshed.access_token,
          expires_at: newExpiresAt,
          // refresh_token might be rotated, check if returned
          refresh_token: refreshed.refresh_token || tokens.refresh_token 
      }).eq("user_id", userId);

      return refreshed.access_token;

  } catch (e) {
      console.error("Refresing Token Exception:", e);
      return null;
  }
}

/**
 * Fetch Recently Played and Upsert to DB
 */
export async function syncRecentlyPlayed(userId: string) {
    const token = await getValidAccessToken(userId);
    if (!token) return;

    // Optional: Get 'after' cursor from latest event?
    // For simplicity, just fetch limit=50. The DB unique constraint handles duplication.
    // If user is heavy listener, we might miss some if we sync infrequent.
    // But 50 tracks is ~3 hours of music. If we sync every 5-10 mins, we are safe.
    
    // Optimization: fetch max 'played_at' for this user to pass as 'after'?
    // But Spotify 'after' cursor is a Unix timestamp in ms
    let afterTimestamp = undefined;
    
    try {
        const { data: latest } = await supabaseAdmin
            .from('listening_events')
            .select('played_at')
            .eq('user_id', userId)
            .order('played_at', { ascending: false })
            .limit(1)
            .single();
        
        if (latest) {
            afterTimestamp = new Date(latest.played_at).getTime();
        }
        
    } catch(e) {}

    const url = new URL("https://api.spotify.com/v1/me/player/recently-played");
    url.searchParams.set("limit", "50");
    if (afterTimestamp) {
        url.searchParams.set("after", afterTimestamp.toString());
    }

    const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) return; // Silent fail

    const data = await res.json();
    if (!data.items || data.items.length === 0) return;

    const rows = data.items.map((item: any) => ({
        user_id: userId,
        played_at: item.played_at,
        track_spotify_id: item.track.id,
        track_name: item.track.name,
        artist_name: item.track.artists[0].name,
        album_name: item.track.album.name,
        album_spotify_id: item.track.album.id,
        cover_url: item.track.album.images[0]?.url,
        duration_ms: item.track.duration_ms,
        context_type: item.context?.type,
        raw: item // store full raw just in case
    }));

    // Upsert
    const { error } = await supabaseAdmin
        .from("listening_events")
        .upsert(rows, { onConflict: 'user_id,track_spotify_id,played_at' });

    if (error) console.error("Sync Error:", error);
}

/**
 * Fetch Currently Playing and Upsert Listening State
 */
export async function syncCurrentlyPlayed(userId: string) {
    const token = await getValidAccessToken(userId);
    if (!token) return;

    const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 204) {
        // Not playing
        await supabaseAdmin.from("listening_state").upsert({
            user_id: userId,
            is_playing: false,
            last_updated: new Date().toISOString()
        });
        return;
    }
    
    if (!res.ok) return;

    const item = await res.json();
    
    if (item.currently_playing_type !== 'track') {
        // Podcast/Ad? Ignore or mark not playing
        return;
    }

    await supabaseAdmin.from("listening_state").upsert({
        user_id: userId,
        is_playing: item.is_playing,
        track_spotify_id: item.item.id,
        progress_ms: item.progress_ms,
        raw: item,
        last_updated: new Date().toISOString()
    });
}
