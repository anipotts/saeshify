import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { subscription } = await request.json();
    if (!subscription || !subscription.endpoint) {
        return NextResponse.json({ error: "Invalid Subscription" }, { status: 400 });
    }

    // Save to DB (using user client is fine as RLS allows insert own)
    // Wait, I need Service Role or RLS "insert with check auth.uid() = user_id".
    // Migration: "create policy for all using (auth.uid() = user_id)"
    // So Standard Client works.

    const { error } = await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_agent: request.headers.get("user-agent")
    }, { onConflict: 'user_id,endpoint' });

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (e: any) {
      console.error("Subscribe Error:", e);
      return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
