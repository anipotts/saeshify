import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

// Init Supabase Admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Init Web Push
// Vapis keys must be set in env
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
} else {
    console.warn("VAPID Keys missing. Push notifications will fail.");
}

export async function sendPushNotification(userId: string, payload: { title: string, body: string, url?: string }) {
    // 1. Get Subscriptions
    const { data: subs } = await supabaseAdmin
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", userId);

    if (!subs || subs.length === 0) return;

    // 2. Send to all endpoints
    const notifications = subs.map(async (sub) => {
        const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
                p256dh: sub.p256dh,
                auth: sub.auth
            }
        };

        try {
            await webpush.sendNotification(
                pushSubscription,
                JSON.stringify(payload)
            );
        } catch (error: any) {
            console.error("Push Error:", error);
            if (error.statusCode === 410 || error.statusCode === 404) {
                // Subscription gone, remove from DB
                await supabaseAdmin
                    .from("push_subscriptions")
                    .delete()
                    .eq("id", sub.id);
            }
        }
    });

    await Promise.all(notifications);
}
