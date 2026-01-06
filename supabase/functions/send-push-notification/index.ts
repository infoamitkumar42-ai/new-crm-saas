/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔥 EDGE FUNCTION: send-push-notification                  ║
 * ║  Status: FINAL & SECURE                                    ║
 * ╚════════════════════════════════════════════════════════════╝
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import webpush from "https://esm.sh/web-push@3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS Headers (Taaki browser se baat kar sake)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // 1. Handle Pre-flight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("📥 Edge Function Triggered!");

    // 2. Load Secrets (Jo aapne Dashboard mein set kiye hain)
    // Deno.env.get() automatically wahan se value uthayega
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const vapidSubject = Deno.env.get("VAPID_SUBJECT");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    // 3. Check VAPID Keys
    if (!vapidSubject || !vapidPublicKey || !vapidPrivateKey) {
      console.error("❌ VAPID Secrets Missing in Dashboard!");
      return new Response(JSON.stringify({ error: "Server Configuration Error: VAPID keys missing" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // 4. Setup WebPush & Supabase
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 5. User ID nikaalo (Webhook se ya Direct Call se)
    let userId: string | null = null;
    let title = "📢 Notification";
    let body = "New update available";
    let data: any = {};

    if (payload.type === "INSERT" && payload.record) {
      // Logic jab Database se trigger ho
      const record = payload.record;
      userId = record.user_id;
      title = "🔥 New Lead Alert!";
      body = `👤 ${record.name || "Unknown"} | 📍 ${record.city || "Online"}`;
      data = { url: "/leads", leadId: record.id };
    } else if (payload.userId) {
      // Logic jab App se direct test ho
      userId = payload.userId;
      title = payload.title || title;
      body = payload.body || body;
    }

    if (!userId) {
      console.log("⚠️ No User ID found inside payload. Skipping.");
      return new Response(JSON.stringify({ message: "No User ID" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, 
      });
    }

    console.log(`🔎 Finding subscriptions for User: ${userId}`);

    // 6. Database se User ke Device Tokens lao
    const { data: subscriptions, error: dbError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (dbError) {
      console.error("❌ DB Error:", dbError);
      throw dbError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("📭 No active devices found for this user.");
      return new Response(JSON.stringify({ message: "User has no subscribed devices" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 7. Notification Bhejo (Sabhi Devices par)
    console.log(`🚀 Sending to ${subscriptions.length} devices...`);

    const notificationPayload = JSON.stringify({
      title,
      body,
      icon: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png", // Fire Icon
      badge: "https://cdn-icons-png.flaticon.com/512/891/891462.png", // Small Badge
      vibrate: [200, 100, 200],
      tag: `lead-${Date.now()}`, // Unique tag taaki duplicate na ho
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
          console.error(`⚠️ Failed to send to device ${sub.id.slice(0,5)}:`, err.statusCode);
          
          // Agar Google bole "Ye device expire ho gaya" (410 Gone)
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log("🗑️ Deleting expired subscription form DB.");
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }
          return { success: false, error: err.message };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Success: ${successCount}/${results.length}`);

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
