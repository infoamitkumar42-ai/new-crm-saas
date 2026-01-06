/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 LOCKED - Edge Function: send-push-notification         ║
 * ║  Status: PRODUCTION READY (Fast Mode)                      ║
 * ║  Logic: Lead Aayi -> Turant Ghanti Bajao 🔔                ║
 * ╚════════════════════════════════════════════════════════════╝
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import webpush from "npm:web-push@3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("📥 Edge Function Triggered!");

    // 1. Secrets Load Karo
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const vapidSubject = Deno.env.get("VAPID_SUBJECT");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidSubject || !vapidPublicKey || !vapidPrivateKey) {
      console.error("❌ VAPID Secrets Missing!");
      return new Response(JSON.stringify({ error: "Configuration Error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    // 2. Target User Kaun Hai?
    let userId: string | null = null;
    let title = "📢 Notification";
    let body = "Update";
    let data: any = {};

    if (payload.type === "INSERT" && payload.record) {
      const record = payload.record;
      userId = record.user_id;
      title = "🔥 New Lead Alert!";
      body = `👤 ${record.name || "Unknown"} | 📍 ${record.city || "Online"}\nTap to check details.`;
      data = { url: "/leads", leadId: record.id };
    } else if (payload.userId) {
      userId = payload.userId;
      title = payload.title || title;
      body = payload.body || body;
    }

    if (!userId) {
      return new Response(JSON.stringify({ message: "No User ID" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`🔎 Target User: ${userId}`);

    // 3. Subscriptions Dhundo
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (!subscriptions || subscriptions.length === 0) {
      console.log("📭 No devices registered.");
      return new Response(JSON.stringify({ message: "No devices found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 4. Notification Bhejo (Direct)
    const notificationPayload = JSON.stringify({
      title,
      body,
      icon: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
      badge: "https://cdn-icons-png.flaticon.com/512/891/891462.png",
      vibrate: [200, 100, 200],
      tag: `lead-${Date.now()}`,
      data
    });

    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            notificationPayload
          );
          return { success: true };
        } catch (err: any) {
          // Auto-Cleaning: Agar device kharab hai (410 Gone), toh delete karo
          if (err.statusCode === 410 || err.statusCode === 404) {
             await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }
          return { success: false };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Sent to ${successCount} devices.`);

    return new Response(JSON.stringify({ success: true, sent: successCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err: any) {
    console.error("💥 Critical Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
