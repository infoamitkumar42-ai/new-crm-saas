import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔄 RAZORPAY-RECONCILE — self-healing payment safety net
 * ═══════════════════════════════════════════════════════════════════════════
 * Runs on a cron (every 15 min) and does NOT depend on Razorpay's webhook
 * delivery working. It polls the Razorpay Payments API directly (using the
 * account's Key ID/Secret) for recently captured payments, and for any
 * payment missing from our `payments` table, replicates the exact same
 * activation logic as functions/api/razorpay-webhook.ts (next-day 7AM IST
 * activation, cumulative quota via baseline = max(received, promised)).
 *
 * This exists because the Cloudflare Pages webhook has silently failed
 * multiple times (redirect/config issues) without any visible error, so
 * real captured payments went unprocessed for hours/days at a time. This
 * function is a backstop: even if the webhook is fully broken, no payment
 * stays unprocessed for more than ~15-30 minutes.
 *
 * Idempotent: skips any payment ID already present in `payments`, so it
 * can safely overlap with a working webhook (both never double-activate).
 * Fire-and-forget from the cron's perspective: always returns 200.
 *
 * ⚠️ KEY ROTATION (2026-08-06): switched to a new Razorpay business account
 * (LeadFlow Technologies, proprietorship). RAZORPAY_KEY_ID/SECRET below now
 * belong to that new account — must match functions/api/create-order.ts and
 * functions/api/razorpay-webhook.ts's Cloudflare Pages env vars exactly, or
 * captured payments on the new account will never reconcile.
 *
 * ⚠️ AUGUST OFFER RE-EXTENDED (2026-08-07, 2 more days — endsAt 2026-08-09
 * 23:59 IST). Pool capacity NOT re-verified for this extension — existing
 * offer-era users' committed recycled_leads_quota already exceeds the live
 * pool (checked 2026-08-07: 1,085 owed vs 790 available). Do not assume
 * capacity is fine until pool is recalculated/widened separately.
 *
 * ⚠️ PLAN_CONFIG DUPLICATION — READ THIS BEFORE CHANGING PLANS
 * ───────────────────────────────────────────────────────────
 * PLAN_CONFIG neeche functions/api/razorpay-webhook.ts ki EXACT copy honi
 * chahiye. In practice ye function hi zyadatar payments process karta hai
 * (Cloudflare webhook aksar silently fail hota hai — BUG-006), isliye ASLI
 * quota yahi decide karta hai.
 *
 * Plan numbers kabhi bhi badlo (offer ON/OFF included) to DONO jagah badlo:
 *   1. functions/api/razorpay-webhook.ts  -> PLAN_CONFIG
 *   2. YE FILE                            -> PLAN_CONFIG  (+ redeploy)
 * Sirf ek badalne se buyers ko galat quota milti hai. Ye 2026-08-05 ko
 * actually hua tha — dekho bugfix.md BUG-013.
 *
 * ⚠️ RENEWAL-WHILE-ACTIVE FIX (2026-08-11) — mirrors razorpay-webhook.ts.
 * If the user is ALREADY active + earning under a current plan, this no
 * longer cuts them off instantly for the new plan's next-day activation.
 * See the wasActiveEarning branch below — same as the webhook, so a payment
 * picked up by THIS poller instead of the webhook gets identical treatment.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const RAZORPAY_KEY_ID = 'rzp_live_TMUFZ5VjWawxOc';
const RAZORPAY_KEY_SECRET = 'lNdxl1E0G9Fcx14ScC1Ir3wE';

const PLAN_CONFIG: Record<string, {
  dailyLeads: number; totalLeads: number; weight: number;
  maxReplacements: number; fresh_count: number; recycled_count: number;
}> = {
  // NORMAL values (offer se pehle wali — revert ke liye):
  //   starter:      { dailyLeads: 5,  totalLeads: 50,  maxReplacements: 5,  fresh_count: 21, recycled_count: 34 },
  //   supervisor:   { dailyLeads: 7,  totalLeads: 80,  maxReplacements: 10, fresh_count: 70, recycled_count: 10 },
  //   manager:      { dailyLeads: 8,  totalLeads: 160, maxReplacements: 16, fresh_count: 76, recycled_count: 74 },
  //   weekly_boost: { dailyLeads: 12, totalLeads: 92,  maxReplacements: 8,  fresh_count: 80, recycled_count: 12 },
  //   turbo_boost:  { dailyLeads: 14, totalLeads: 108, maxReplacements: 10, fresh_count: 93, recycled_count: 15 },
  starter:      { dailyLeads: 9,  totalLeads: 90,  weight: 1, maxReplacements: 9,  fresh_count: 45, recycled_count: 45  },
  supervisor:   { dailyLeads: 11, totalLeads: 136, weight: 3, maxReplacements: 13, fresh_count: 70, recycled_count: 66  },
  manager:      { dailyLeads: 14, totalLeads: 272, weight: 5, maxReplacements: 27, fresh_count: 76, recycled_count: 196 },
  weekly_boost: { dailyLeads: 26, totalLeads: 181, weight: 7, maxReplacements: 18, fresh_count: 84, recycled_count: 97  },
  turbo_boost:  { dailyLeads: 33, totalLeads: 227, weight: 9, maxReplacements: 21, fresh_count: 93, recycled_count: 134 },
};

serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const results: any[] = [];

  try {
    // 2h lookback window — comfortably overlaps the 15 min cron interval
    // even if a run is delayed, so no payment can slip through the gap.
    const fromTs = Math.floor(Date.now() / 1000) - (2 * 60 * 60);
    const authHeader = 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    const rzpRes = await fetch(`https://api.razorpay.com/v1/payments?from=${fromTs}&count=100`, {
      headers: { 'Authorization': authHeader },
    });

    if (!rzpRes.ok) {
      const errText = await rzpRes.text();
      console.error('Razorpay API error:', errText);
      return new Response(JSON.stringify({ error: 'Razorpay API error', detail: errText }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rzpData = await rzpRes.json();
    const payments = rzpData.items || [];

    for (const payment of payments) {
      if (payment.status !== 'captured') continue;

      const { data: existing } = await supabase
        .from('payments')
        .select('id')
        .eq('razorpay_payment_id', payment.id)
        .maybeSingle();

      if (existing) {
        results.push({ id: payment.id, status: 'already_exists' });
        continue;
      }

      const userId = payment.notes?.user_id || payment.notes?.userId;
      const planNameRaw = payment.notes?.plan_name || payment.notes?.planId;
      const teamCode = payment.notes?.team_code || null;

      if (!userId || !planNameRaw) {
        results.push({ id: payment.id, status: 'skipped_no_notes' });
        continue;
      }

      const normalizedPlan = String(planNameRaw).toLowerCase().replace(/[\s-]+/g, '_');
      const config = PLAN_CONFIG[normalizedPlan];
      if (!config) {
        results.push({ id: payment.id, status: 'skipped_unknown_plan', plan: normalizedPlan });
        continue;
      }

      await supabase.from('payments').insert({
        user_id: userId,
        razorpay_payment_id: payment.id,
        amount: payment.amount / 100,
        plan_name: normalizedPlan,
        status: 'captured',
        raw_payload: payment,
      });

      const { data: userData } = await supabase
        .from('users')
        .select('total_leads_promised, total_leads_received, team_code, is_active, payment_status')
        .eq('id', userId)
        .maybeSingle();

      if (!userData) {
        results.push({ id: payment.id, status: 'user_not_found', userId });
        continue;
      }

      const currentPromised = userData.total_leads_promised || 0;
      const currentReceived = userData.total_leads_received || 0;
      const existingTeamCode = userData.team_code || null;
      const resolvedTeamCode = existingTeamCode || teamCode;

      // 2026-08-11: renewal-while-active fix (mirrors razorpay-webhook.ts).
      // If the user is already active + earning, don't cut them off instantly
      // for the new plan's next-day activation — keep today's current plan
      // running, stash the new plan in pending_plan_name, let
      // check-quota-expiry's 7 AM IST pass apply it tomorrow.
      const wasActiveEarning = userData.is_active === true && userData.payment_status === 'active';

      // Safe cumulative: same baseline logic as razorpay-webhook.ts, so a
      // corrupted total_leads_promised never causes instant plan expiry.
      const baseline = Math.max(currentReceived, currentPromised);
      const newTotalLeadsPromised = baseline + config.totalLeads;

      const now = new Date();
      const istOffsetMs = 5.5 * 60 * 60 * 1000;
      const tomorrowIST = new Date(now.getTime() + istOffsetMs);
      tomorrowIST.setUTCDate(tomorrowIST.getUTCDate() + 1);
      tomorrowIST.setUTCHours(1, 30, 0, 0); // 01:30 UTC = 07:00 IST
      const activationTime = tomorrowIST.toISOString();

      const updateBody = wasActiveEarning
        ? {
            payment_status: 'active',
            is_plan_pending: true,
            plan_activation_time: activationTime,
            pending_plan_name: normalizedPlan,
            total_leads_promised: newTotalLeadsPromised,
            valid_until: '2099-01-01T00:00:00.000Z',
            updated_at: now.toISOString(),
            ...(resolvedTeamCode ? { team_code: resolvedTeamCode } : {}),
          }
        : {
            plan_name: normalizedPlan,
            payment_status: 'active',
            is_active: false,
            is_online: false,
            is_plan_pending: true,
            plan_activation_time: activationTime,
            is_new_system: true,
            daily_limit: config.dailyLeads,
            total_leads_promised: newTotalLeadsPromised,
            plan_weight: config.weight,
            max_replacements: config.maxReplacements,
            valid_until: '2099-01-01T00:00:00.000Z',
            leads_today: 0,
            plan_start_date: now.toISOString(),
            updated_at: now.toISOString(),
            fresh_leads_quota: config.fresh_count,
            recycled_leads_quota: config.recycled_count,
            fresh_leads_received: 0,
            recycled_leads_received: 0,
            ...(resolvedTeamCode ? { team_code: resolvedTeamCode } : {}),
          };

      const { error: updateErr } = await supabase.from('users').update(updateBody).eq('id', userId);

      if (updateErr) {
        results.push({ id: payment.id, status: 'user_update_failed', error: updateErr.message });
        continue;
      }

      results.push({
        id: payment.id,
        status: wasActiveEarning ? 'deferred_renewal' : 'activated',
        userId,
        plan: normalizedPlan,
      });
    }

    return new Response(JSON.stringify({ checked: payments.length, results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e: any) {
    console.error('razorpay-reconcile error:', e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
