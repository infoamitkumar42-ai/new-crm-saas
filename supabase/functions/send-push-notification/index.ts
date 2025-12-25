import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import webpush from "npm:web-push@3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("📥 Received payload:", JSON.stringify(payload));

    // Determine if this is from webhook or direct call
    let userId: string;
    let title: string;
    let body: string;
    let data: any = {};

    if (payload.type === "INSERT" && payload.record) {
      // ═══════════════════════════════════════════════════════
      // Called from Database Webhook (NEW LEAD INSERTED)
      // ═══════════════════════════════════════════════════════
      console.log("📌 Webhook trigger detected - New Lead!");

      const record = payload.record;

      // Your leads table has 'user_id' column
      userId = record.user_id;

      if (!userId) {
        console.log("⚠️ Lead has no user_id assigned yet, skipping notification");
        return new Response(
          JSON.stringify({ message: "No user_id in lead, skipped" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      // Build notification content
      const leadName = record.name || "Unknown";
      const leadPhone = record.phone || "N/A";
      const leadCity = record.city || "";

      title = "🔥 Naya Lead Aaya Hai!";
      body = `👤 ${leadName}${leadCity ? ` | 📍 ${leadCity}` : ""}\n📞 ${leadPhone}`;

      data = {
        url: "/leads",
        leadId: record.id,
        leadName: leadName,
        leadPhone: leadPhone,
        type: "new_lead",
      };
    } else if (payload.userId) {
      // ═══════════════════════════════════════════════════════
      // Direct call (from frontend test or manual trigger)
      // ═══════════════════════════════════════════════════════
      console.log("📌 Direct call detected");

      userId = payload.userId;
      title = payload.title || "📢 Notification";
      body = payload.body || "";
      data = payload.data || {};
    } else {
      console.error("❌ Invalid payload format");
      return new Response(
        JSON.stringify({ error: "Invalid payload format", received: payload }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log("👤 Target user_id:", userId);
    console.log("📝 Title:", title);
    console.log("📝 Body:", body);

    // ═══════════════════════════════════════════════════════
    // Initialize Supabase Client
    // ═══════════════════════════════════════════════════════
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ═══════════════════════════════════════════════════════
    // Configure VAPID Keys
    // ═══════════════════════════════════════════════════════
    const vapidSubject = Deno.env.get("VAPID_SUBJECT");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    console.log("🔑 VAPID Check:", {
      hasSubject: !!vapidSubject,
      hasPublicKey: !!vapidPublicKey,
      hasPrivateKey: !!vapidPrivateKey,
    });

    if (!vapidSubject || !vapidPublicKey || !vapidPrivateKey) {
      console.error("❌ VAPID keys not configured in secrets!");
      return new Response(
        JSON.stringify({
          error: "VAPID keys not configured",
          missing: {
            subject: !vapidSubject,
            publicKey: !vapidPublicKey,
            privateKey: !vapidPrivateKey,
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    console.log("✅ VAPID configured successfully");

    // ═══════════════════════════════════════════════════════
    // Fetch User's Push Subscriptions
    // ═══════════════════════════════════════════════════════
    const { data: subscriptions, error: fetchError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (fetchError) {
      console.error("❌ Error fetching subscriptions:", fetchError);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch subscriptions",
          details: fetchError,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("⚠️ No push subscriptions found for user:", userId);
      return new Response(
        JSON.stringify({
          message: "No subscriptions found for this user",
          userId,
          hint: "User needs to enable notifications in the app first",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    console.log(`📱 Found ${subscriptions.length} subscription(s) for user`);

    // ═══════════════════════════════════════════════════════
    // Prepare Notification Payload
    // ═══════════════════════════════════════════════════════
    const notificationPayload = JSON.stringify({
      title,
      body,
      icon: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
      badge: "https://cdn-icons-png.flaticon.com/512/891/891462.png",
      vibrate: [300, 100, 300, 100, 300],
      tag: `lead-${Date.now()}`,
      renotify: true,
      requireInteraction: true,
      actions: [
        { action: "open", title: "📂 Open Dashboard" },
        { action: "dismiss", title: "❌ Dismiss" },
      ],
      data,
    });

    // ═══════════════════════════════════════════════════════
    // Send Push to All Subscriptions
    // ═══════════════════════════════════════════════════════
    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          console.log(
            `📤 Sending to: ${sub.endpoint.substring(0, 60)}...`
          );

          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            notificationPayload
          );

          console.log(`✅ Push sent successfully to subscription ${sub.id}`);
          return { subscriptionId: sub.id, success: true };
        } catch (err: any) {
          console.error(
            `❌ Push failed for subscription ${sub.id}:`,
            err.message,
            err.statusCode
          );

          // Clean up expired/invalid subscriptions
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log("🗑️ Removing expired subscription:", sub.id);
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
            return {
              subscriptionId: sub.id,
              success: false,
              error: "Subscription expired - removed",
              statusCode: err.statusCode,
            };
          }

          return {
            subscriptionId: sub.id,
            success: false,
            error: err.message,
            statusCode: err.statusCode,
          };
        }
      })
    );

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    console.log(
      `📊 Final Results: ${successCount} sent, ${failCount} failed out of ${results.length} total`
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notification sent to ${successCount}/${results.length} devices`,
        sent: successCount,
        failed: failCount,
        total: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err: any) {
    console.error("❌ Unhandled error:", err);
    return new Response(
      JSON.stringify({
        error: err.message,
        stack: err.stack,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
