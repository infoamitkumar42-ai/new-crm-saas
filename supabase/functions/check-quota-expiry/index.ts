import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ─────────────────────────────────────────────────────────────────
    // MIDNIGHT RESET SAFEGUARD (runs at 7 AM IST, before webhook starts at 8 AM)
    // Any user with leads_today > 0 at 7 AM MUST have a stale counter
    // from yesterday — working hours start at 8 AM so nothing is assigned yet.
    // If the midnight reset cron failed, this catches it before the day begins.
    // ─────────────────────────────────────────────────────────────────
    const { data: staleUsers, error: resetErr } = await supabase
      .from("users")
      .update({ leads_today: 0 })
      .gt("leads_today", 0)
      .select("id, email, leads_today");

    if (resetErr) {
      console.warn("⚠️ Safeguard reset warning:", resetErr.message);
    } else {
      const staleCount = staleUsers?.length || 0;
      if (staleCount > 0) {
        console.warn(`🚨 MIDNIGHT RESET HAD FAILED! Safeguard fixed ${staleCount} stale leads_today counters:`,
          staleUsers?.map(u => `${u.email}(was:${u.leads_today})`).join(', '));
      } else {
        console.log("✅ Safeguard check: all leads_today = 0 (midnight reset worked correctly)");
      }
    }
    // ─────────────────────────────────────────────────────────────────

    console.log("🔍 Quota Expiry Check Started...");

    // 1. Find quota-full users
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, plan_name, total_leads_promised, total_leads_received, is_active, payment_status")
      .eq("is_active", true)
      .eq("payment_status", "active")
      .gt("total_leads_promised", 0);

    if (error) {
      console.error("❌ DB Error:", error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!users || users.length === 0) {
      console.log("ℹ️ No active users to check.");
      return new Response(JSON.stringify({ message: "No active users", checked: 0, expired: 0 }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log("📊 Checking " + users.length + " active users...");

    let expiredCount = 0;
    const expiredUsers = [];

    for (const user of users) {
      const received = user.total_leads_received || 0;
      const promised = user.total_leads_promised || 0;

      if (promised > 0 && received >= promised) {
        // QUOTA FULL — Deactivate
        console.log("⏰ Quota full: " + user.email + " (" + received + "/" + promised + ")");

        const { error: updateError } = await supabase
          .from("users")
          .update({
            is_active: false,
            is_online: false,
            daily_limit: 0,
            payment_status: "expired",
            plan_name: "none",
            updated_at: new Date().toISOString()
          })
          .eq("id", user.id);

        if (!updateError) {
          expiredCount++;
          expiredUsers.push({
            email: user.email,
            plan: user.plan_name,
            received: received,
            promised: promised
          });

          // Send push notification
          try {
            const { data: subscriptions } = await supabase
              .from("push_subscriptions")
              .select("*")
              .eq("user_id", user.id);

            if (subscriptions && subscriptions.length > 0) {
              const vapidSubject = Deno.env.get("VAPID_SUBJECT");
              const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
              const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

              if (vapidSubject && vapidPublicKey && vapidPrivateKey) {
                webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

                const notifPayload = JSON.stringify({
                  title: "📋 Plan Complete!",
                  body: "Aapki " + promised + " leads deliver ho chuki hain. Renew karein!",
                  data: { url: "/plans" }
                });

                for (const sub of subscriptions) {
                  try {
                    await webpush.sendNotification(
                      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                      notifPayload
                    );
                  } catch (pushErr) {
                    // Stale sub — auto delete
                    if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
                      await supabase.from("push_subscriptions").delete().eq("id", sub.id);
                    }
                  }
                }
              }
            }
          } catch (notifErr) {
            console.log("⚠️ Push notification failed (non-critical):", notifErr.message);
          }
        } else {
          console.error("❌ Update failed for " + user.email + ":", updateError.message);
        }
      }
    }

    // Log summary
    const nearQuotaUsers = users.filter(u => {
      const remaining = (u.total_leads_promised || 0) - (u.total_leads_received || 0);
      return remaining > 0 && remaining <= 5;
    });

    console.log("✅ Check complete: " + expiredCount + " expired, " + nearQuotaUsers.length + " near quota");

    return new Response(JSON.stringify({
      success: true,
      checked: users.length,
      expired: expiredCount,
      expired_users: expiredUsers,
      near_quota: nearQuotaUsers.map(u => ({
        email: u.email,
        remaining: (u.total_leads_promised || 0) - (u.total_leads_received || 0)
      }))
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("💥 Critical Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
