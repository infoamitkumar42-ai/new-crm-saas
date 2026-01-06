/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 LOCKED - Edge Function: send-push-notification         ║
 * ║  Status: PRODUCTION READY                                  ║
 * ║  Features:                                                 ║
 * ║  - ✅ VAPID Push Notification Logic                        ║
 * ║  - ✅ CORS Headers Handled                                 ║
 * ║  - ✅ Auto-Cleanup of Expired Tokens                       ║
 * ╚════════════════════════════════════════════════════════════╝
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import webpush from "https://esm.sh/web-push@3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // 1. Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("📥 Received payload:", JSON.stringify(payload));

    let userId: string;
    let title: string;
    let body: string;
    let data: any = {};

    // 2. Determine Notification Content
    if (payload.type === "INSERT" && payload.record) {
      console.log("📌 New Lead Webhook!");
      const record = payload.record;
      userId = record.user_id;

      if (!userId) {
        console.log("⚠️ No user_id, skipping");
        return new Response(JSON.stringify({ message: "No user_id" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      title = "🔥 New Lead Alert!";
      body = `👤 ${record.name || "Unknown"} | 📞 ${record.phone || "N/A"}\nTap to view details`;
      data = { url: "/leads", leadId: record.id };

    } else if (payload.userId) {
      console.log("📌 Direct call");
      userId = payload.userId;
      title = payload.title || "📢 Notification";
      body = payload.body || "";
      data = payload.data || {};
    } else {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log("👤 Target User:", userId);

    // 3. Load Secrets & Init Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const vapidSubject = Deno.env.get("VAPID_SUBJECT");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidSubject || !vapidPublicKey || !vapidPrivateKey) {
      console.error("❌ VAPID keys missing!");
      return new Response(JSON.stringify({ error: "VAPID not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    // 4. Fetch User Subscriptions
    const { data: subscriptions, error: fetchError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (fetchError) {
      console.error("❌ Database error:", fetchError);
      return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("⚠️ No subscriptions found for user");
      return new Response(JSON.stringify({ message: "No subscriptions" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`📱 Found ${subscriptions.length} devices`);

    // 5. Send Notifications
    const notificationPayload = JSON.stringify({
      title,
      body,
      icon: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
      badge: "https://cdn-icons-png.flaticon.com/512/891/891462.png",
      vibrate: [300, 100, 300],
      tag: `lead-${Date.now()}`,
      renotify: true,
      requireInteraction: true,
      data,
    });

    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { 
              endpoint: sub.endpoint, 
              keys: { p256dh: sub.p256dh, auth: sub.auth } 
            },
            notificationPayload
          );
          return { success: true, id: sub.id };
        } catch (err: any) {
          console.error(`❌ Failed for ${sub.id}:`, err.message);
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log("🗑️ Cleaning up expired subscription");
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }
          return { success: false, id: sub.id, error: err.message };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    console.log(`📊 Sent: ${successCount}/${results.length}`);

    return new Response(JSON.stringify({ success: true, sent: successCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err: any) {
    console.error("❌ Unhandled error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
