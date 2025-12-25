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
    
    let userId: string;
    let title: string;
    let body: string;
    let data: any = {};

    if (payload.type === "INSERT" && payload.record) {
      const record = payload.record;
      userId = record.user_id;

      if (!userId) {
        return new Response(JSON.stringify({ message: "No user_id" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      title = "🔥 Naya Lead Aaya Hai!";
      body = `👤 ${record.name || "Unknown"} | 📞 ${record.phone || "N/A"}`;
      data = { url: "/leads", leadId: record.id };

    } else if (payload.userId) {
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const vapidSubject = Deno.env.get("VAPID_SUBJECT");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidSubject || !vapidPublicKey || !vapidPrivateKey) {
      console.error("VAPID missing");
      return new Response(JSON.stringify({ error: "VAPID not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    // Fetch subscriptions (optimized query)
    const { data: subscriptions, error: fetchError } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", userId);

    if (fetchError || !subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: "No subscriptions" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

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

    // Send to all subscriptions in parallel (fast!)
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
          // Cleanup invalid subscriptions
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }
          return { success: false, id: sub.id };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;

    return new Response(JSON.stringify({ 
      success: true, 
      sent: successCount,
      total: results.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err: any) {
    console.error("Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
