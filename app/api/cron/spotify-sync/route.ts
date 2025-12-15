import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { syncRecentlyPlayed, syncCurrentlyPlayed } from "@/lib/spotify/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Allow development overrides if needed or if Vercel uses different header logic? 
      // Standard Vercel Cron uses Authorization header.
      return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: users, error } = await supabaseAdmin
    .from("spotify_tokens")
    .select("user_id");

  if (error) {
      console.error("Cron Error Fetching Users:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!users || users.length === 0) {
      return NextResponse.json({ message: "No users to sync" });
  }

  const results = [];
  
  // Sequential for safety, parallel possible but let's be nice to rate limits
  for (const user of users) {
      try {
          await syncRecentlyPlayed(user.user_id);
          await syncCurrentlyPlayed(user.user_id);
          results.push({ id: user.user_id, status: "synced" });
      } catch (e: any) {
          console.error(`Sync failed for user ${user.user_id}:`, e);
          results.push({ id: user.user_id, status: "failed", error: e.message });
      }
  }

  return NextResponse.json({ success: true, timestamp: new Date().toISOString(), results });
}
