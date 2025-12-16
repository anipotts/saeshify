import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { syncRecentlyPlayed, syncCurrentlyPlayed } from '@/lib/spotify/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.session) {
      // Capture Spotify Tokens
      const { session } = data;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (session.provider_token && serviceRoleKey) {
          try {
             // 1. Get Spotify User ID
             const spotifyRes = await fetch('https://api.spotify.com/v1/me', {
                headers: { Authorization: `Bearer ${session.provider_token}` }
             });
             
             if (spotifyRes.ok) {
                 const spotifyUser = await spotifyRes.json();
                 
                 const adminSupabase = createAdminClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!
                 );

                 // 2. Prepare Data
                 const tokenData: any = {
                     user_id: session.user.id,
                     spotify_user_id: spotifyUser.id,
                     access_token: session.provider_token,
                     expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
                     updated_at: new Date().toISOString(),
                 };
                 
                 if (session.provider_refresh_token) {
                     tokenData.refresh_token = session.provider_refresh_token;
                 }
                 
                 // 3. Handle Refresh Token Persistence (Don't overwrite with null)
                 // If we didn't get a new refresh token (e.g. re-login without consent prompt), keep the old one.
                 if (!tokenData.refresh_token) {
                     const { data: existing } = await adminSupabase
                        .from('spotify_tokens')
                        .select('refresh_token')
                        .eq('user_id', session.user.id)
                        .single();
                     
                     if (existing?.refresh_token) {
                         tokenData.refresh_token = existing.refresh_token;
                     }
                 }
                 
                 // 4. Upsert
                 if (tokenData.refresh_token) {
                     await adminSupabase.from('spotify_tokens').upsert(tokenData);
                     
                     // 5. Initial Sync (Blocking to ensure data on landing)
                     try {
                        console.log("Starting initial Spotify sync for", session.user.id);
                        await Promise.all([
                            syncRecentlyPlayed(session.user.id),
                            syncCurrentlyPlayed(session.user.id)
                        ]);
                        console.log("Initial Spotify sync complete");
                     } catch (syncErr) {
                         console.error("Initial Sync Failed:", syncErr);
                     }

                 } else {
                     console.warn("Spotify Login: Missing refresh token. Ensure 'access_type: offline' and 'prompt: consent' are set.");
                 }
             }
          } catch (e) {
              console.error("Error syncing Spotify tokens:", e);
          }
      }

      // Redirect
      const forwardedHost = request.headers.get('x-forwarded-host') 
      const isLocal = origin.includes('localhost')
      if (isLocal) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
