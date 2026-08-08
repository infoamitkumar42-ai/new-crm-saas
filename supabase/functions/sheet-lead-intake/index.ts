import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 📥 SHEET-LEAD-INTAKE v6 — Google Sheet (Meta native sync) -> CRM bridge
 * ═══════════════════════════════════════════════════════════════════════════
 * v6 (admin decision 2026-08-08):
 *  1. FORM-BASED MANAGER ROUTING — form_id WOMEN_ONLY_FORM_ID ("TEAM ECO
 *     SIMAR", form_id 2419407918566414 per the Apps Script's own
 *     FORM_OVERRIDES label — CONFIRM this matches the intended form before
 *     trusting it blindly) is women/girls-only leads. These must go ONLY to
 *     users managed by SIMARJIT (simar@forever.com, manager_id below) —
 *     never to the general ECO@WIN12/TEAMFIRE pool, even if Simar's team is
 *     at capacity (that would leak women-only leads to unrelated agents).
 *     Requires the Apps Script to send `form_id` in the payload (it computes
 *     form_id internally for column-mapping already, but wasn't forwarding
 *     it — see the Apps Script patch alongside this deploy).
 *  2. CAPI SIGNAL ADDED — this function previously sent NO Meta CAPI signal
 *     at all for any sheet-sourced lead (verified: zero CAPI code existed
 *     before this version). A pixel_config row for team_code='ECO@WIN12'
 *     ("TEAM ECO SIMAR", pixel_id 2334725197446887) already existed live
 *     since 2026-07-08 but was never actually called from here. Now sends
 *     the same 'Lead' event as meta-webhook.ts, matched by the intake
 *     token's own team_code (first team) — applies to ALL leads from this
 *     Google Sheet channel, not just the women-only form.
 *
 * v5 (admin decision 2026-08-06): 'Duplicate' status removed for repeat phone
 * numbers. Purana behavior: same phone kabhi bhi pehle aaya ho (chahe mahino
 * purana) to naya submission 'Duplicate' status mein insert hota tha aur
 * KABHI kisi ko assign nahi hota tha. Naya behavior: genuine repeat form-fill
 * ko bilkul fresh lead ki tarah treat karo, normal assignment se guzro — sirf
 * ek technical safeguard: same phone 10 min ke andar dobara aaye to Apps
 * Script retry/double-fire maan kar skip karo (double-insert na ho).
 *
 * v4: sheet_intake_tokens.team_code ab multi-team comma-list ho sakta hai
 * (e.g. 'ECO@WIN12,TEAMFIRE' — team jiske apne active members na ho, uski
 * leads doosri team ko automatically route ho sakti hain). Fallback `source`
 * label sirf PEHLA team use karta hai, poori routing-string nahi.
 *
 * v3: qualifying-question fields (education, profession, experience, dob)
 * ko `lead_details` JSONB mein capture karta hai.
 *
 * For teams whose Meta leads land in a Google Sheet (not yet on the native
 * FB Page webhook), this endpoint accepts a simple JSON lead payload from a
 * Google Apps Script trigger and runs it through the SAME assignment logic
 * as meta-webhook: recent-retry check -> working-hours check -> RPC-based
 * best-assignee lookup -> insert -> push notification -> CAPI.
 *
 * AUTH: verify_jwt is disabled (Apps Script can't hold a Supabase session,
 * same reason meta-webhook disables it). Instead, the caller must send a
 * bearer secret in the `x-intake-secret` header. That secret is looked up
 * in `sheet_intake_tokens` and the team_code is taken from THAT row (not
 * from the request body) -- so a leaked/guessed secret can only ever route
 * leads to the team(s) it was issued for, never an arbitrary team_code.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const WORKING_HOURS = { START: 8, END: 22, TIMEZONE: 'Asia/Kolkata' };

// Women/girls-only form — leads from this form_id go ONLY to users managed
// by SIMARJIT, never to the general team pool. See header note above.
const WOMEN_ONLY_FORM_ID = '2419407918566414';
const SIMAR_MANAGER_ID = 'acaf3c4d-22bf-43eb-b91d-eae0d6af9f76'; // simar@forever.com

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-intake-secret',
};

function isWithinWorkingHours(): boolean {
  const now = new Date();
  const hour = parseInt(new Intl.DateTimeFormat('en-US', {
    hour: '2-digit', hour12: false, timeZone: WORKING_HOURS.TIMEZONE
  }).format(now));
  return hour >= WORKING_HOURS.START && hour < WORKING_HOURS.END;
}

function isValidIndianPhone(phone: string): boolean {
  return /^[6789]\d{9}$/.test(phone);
}

function sanitizePhone(raw: string): string {
  return (raw || '').replace(/\D/g, '').slice(-10);
}

function buildLeadDetails(body: any): Record<string, string> | null {
  const details: Record<string, string> = {};
  const map: Record<string, string> = {
    education: 'Education',
    profession: 'Profession',
    experience: 'Experience',
    dob: 'Date of Birth',
  };
  for (const [key, label] of Object.entries(map)) {
    const v = (body[key] || '').toString().trim();
    if (v) details[label] = v;
  }
  return Object.keys(details).length > 0 ? details : null;
}

// Finds the best active user managed by `managerId`, using the same
// fairness rule as get_best_assignee_for_team (lowest fill-ratio first,
// plan_weight as tiebreaker) but scoped by manager_id instead of team_code.
// Kept as a separate inline check (not a shared RPC) so it can't affect
// the normal team-based routing path used by everyone else.
async function findManagerScopedAssignee(supabase: any, managerId: string) {
  const { data: candidates } = await supabase
    .from('users')
    .select('id, name, email, daily_limit, total_leads_received, total_leads_promised, plan_weight')
    .eq('manager_id', managerId)
    .eq('is_active', true)
    .eq('is_online', true)
    .eq('payment_status', 'active');

  if (!candidates || candidates.length === 0) return null;

  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const startOfDayIso = new Date(`${todayIST}T00:00:00+05:30`).toISOString();

  const scored: { user: any; fillRatio: number; weight: number }[] = [];

  for (const u of candidates) {
    if (u.total_leads_promised > 0 && u.total_leads_received >= u.total_leads_promised) continue;

    const { count: todayCount } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', u.id)
      .gte('assigned_at', startOfDayIso);

    const dailyLimit = u.daily_limit || 0;
    if (dailyLimit > 0 && (todayCount || 0) >= dailyLimit) continue;

    const fillRatio = dailyLimit > 0 ? (todayCount || 0) / dailyLimit : 0;
    scored.push({ user: u, fillRatio, weight: u.plan_weight || 1 });
  }

  if (scored.length === 0) return null;
  scored.sort((a, b) => a.fillRatio - b.fillRatio || b.weight - a.weight);
  return scored[0].user;
}

async function sendCapiLeadEvent(
  supabase: any,
  teamCodeForPixelMatch: string,
  leadId: string,
  name: string,
  phone: string,
  city: string
) {
  try {
    const { data: pixelConfigs } = await supabase
      .from('pixel_config')
      .select('pixel_id, capi_access_token, team_code')
      .eq('is_active', true);

    const matchedPixel = pixelConfigs?.find((c: any) => c.team_code === teamCodeForPixelMatch) || null;

    if (!matchedPixel || matchedPixel.capi_access_token === 'PENDING_TOKEN') {
      console.log(`[CAPI] ⏭️ Skipped — ${!matchedPixel ? 'no config' : 'PENDING_TOKEN'} | team: ${teamCodeForPixelMatch}`);
      return;
    }

    const hashValue = async (val: string): Promise<string> => {
      const encoder = new TextEncoder();
      const data = encoder.encode((val || '').toLowerCase().trim());
      const hash = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const formatPhone = (p: string): string => {
      const digits = (p || '').replace(/\D/g, '');
      if (digits.startsWith('91') && digits.length === 12) return digits;
      if (digits.length === 10) return '91' + digits;
      return digits;
    };

    const capiPayload = {
      data: [{
        event_name: 'Lead',
        event_id: `sheetlead_${leadId}_${Math.floor(Date.now() / 1000)}`,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'crm',
        user_data: {
          ph: [await hashValue(formatPhone(phone))],
          fn: [await hashValue(name || '')],
          ct: [await hashValue(city || '')],
          country: [await hashValue('in')],
        },
        custom_data: {
          event_source: 'crm',
          lead_event_source: 'LeadFlow CRM',
          currency: 'INR',
          value: 0,
        },
      }],
    };

    const capiResp = await fetch(
      `https://graph.facebook.com/v18.0/${matchedPixel.pixel_id}/events?access_token=${matchedPixel.capi_access_token}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(capiPayload) }
    );
    const capiResult = await capiResp.json();
    console.log(`[CAPI] ✅ Pixel ${matchedPixel.pixel_id} | team: ${teamCodeForPixelMatch} | Result:`, JSON.stringify(capiResult));
  } catch (capiError: any) {
    // NEVER fail the main intake because of CAPI
    console.error('[CAPI] ❌ Error (non-fatal):', capiError.message);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const secret = req.headers.get('x-intake-secret');
    if (!secret) {
      return new Response(JSON.stringify({ error: 'Missing x-intake-secret header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: tokenRow } = await supabase
      .from('sheet_intake_tokens')
      .select('team_code, is_active')
      .eq('token', secret)
      .maybeSingle();

    if (!tokenRow || !tokenRow.is_active) {
      return new Response(JSON.stringify({ error: 'Invalid or inactive secret' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const teamCode = tokenRow.team_code;
    // Source label ke liye sirf PEHLA team use karo, poori multi-team
    // routing-string nahi — warna source jaisa "GoogleSheet-ECO@WIN12,TEAMFIRE"
    // ban jata hai jo reporting mein confusing hai. Same team CAPI pixel match
    // ke liye bhi use hota hai (pixel_config is currently keyed by this team).
    const sourceTeamLabel = teamCode.split(',')[0].trim();

    const body = await req.json();
    const name = (body.name || 'Unknown Lead').toString().trim();
    const city = (body.city || 'Unknown').toString().trim();
    const state = (body.state || '').toString().trim() || null;
    const source = (body.source || `GoogleSheet-${sourceTeamLabel}`).toString().trim();
    const phone = sanitizePhone(body.phone);
    const formId = (body.form_id || '').toString().replace(/^f:/, '').trim() || null;
    const leadDetails = buildLeadDetails(body);
    const isWomenOnlyForm = formId === WOMEN_ONLY_FORM_ID;

    // ---- Invalid phone ----
    if (!isValidIndianPhone(phone)) {
      await supabase.from('leads').insert({
        name, phone: phone || 'INVALID', city, state, source, status: 'Invalid', lead_details: leadDetails, form_id: formId
      });
      return new Response(JSON.stringify({ status: 'invalid_phone' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ---- Recent-retry guard (NOT a duplicate block — see v5 header note) ----
    const { data: recentDup } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', phone)
      .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .limit(1);

    if (recentDup && recentDup.length > 0) {
      return new Response(JSON.stringify({ status: 'skipped_recent_retry' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ---- Night hours -> backlog (picked up by existing process-backlog cron) ----
    if (!isWithinWorkingHours()) {
      await supabase.from('leads').insert({ name, phone, city, state, source, status: 'Night_Backlog', lead_details: leadDetails, form_id: formId });
      return new Response(JSON.stringify({ status: 'night_backlog' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ---- Assignment: women-only form -> Simar's team ONLY, else normal RPC ----
    let finalUserId: string | null = null;
    let finalUserName: string | null = null;

    if (isWomenOnlyForm) {
      const target = await findManagerScopedAssignee(supabase, SIMAR_MANAGER_ID);
      if (!target) {
        // Deliberately does NOT fall back to the general team pool — a
        // women-only lead leaking to unrelated agents defeats the whole
        // point of this routing rule. Waits in Queued instead.
        await supabase.from('leads').insert({
          name, phone, city, state, source, status: 'Queued',
          notes: `Women-only form (${WOMEN_ONLY_FORM_ID}) - no active user under SIMARJIT right now`,
          lead_details: leadDetails, form_id: formId
        });
        return new Response(JSON.stringify({ status: 'queued_no_eligible_simar_user' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      finalUserId = target.id;
      finalUserName = target.name;
    } else {
      const { data: bestUser, error: rpcError } = await supabase
        .rpc('get_best_assignee_for_team', { p_team_code: teamCode });

      if (rpcError || !bestUser || bestUser.length === 0) {
        await supabase.from('leads').insert({
          name, phone, city, state, source, status: 'Queued',
          notes: `Team ${teamCode} - all users at capacity`, lead_details: leadDetails, form_id: formId
        });
        return new Response(JSON.stringify({ status: 'queued_no_eligible_user' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const target = bestUser[0];
      finalUserId = target.user_id || target.out_user_id;
      finalUserName = target.user_name;
    }

    const { data: newLead, error: assignError } = await supabase.from('leads').insert({
      name, phone, city, state, source,
      status: 'Assigned',
      assigned_to: finalUserId,
      user_id: finalUserId,
      assigned_at: new Date().toISOString(),
      lead_type: 'fresh',
      recycle_count: 0,
      lead_details: leadDetails,
      form_id: formId
    }).select('id').single();

    if (assignError) {
      await supabase.from('leads').insert({ name, phone, city, state, source, status: 'Queued', lead_details: leadDetails, form_id: formId });
      return new Response(JSON.stringify({ status: 'assign_failed', error: assignError.message }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ---- Push notification (non-critical, same pattern as meta-webhook) ----
    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: finalUserId,
          lead_name: name,
          lead_phone: phone,
          title: '🎉 Naya Lead Aaya!',
          body: `${name} - ${phone}`,
          type: 'new_lead'
        })
      });
    } catch (notifErr) {
      console.log('Push notification failed (non-critical):', notifErr);
    }

    // ---- CAPI signal (non-critical, matched by the intake token's team) ----
    await sendCapiLeadEvent(supabase, sourceTeamLabel, newLead.id, name, phone, city);

    return new Response(JSON.stringify({ status: 'assigned', assigned_to: finalUserName || finalUserId }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    console.error('sheet-lead-intake error:', e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
