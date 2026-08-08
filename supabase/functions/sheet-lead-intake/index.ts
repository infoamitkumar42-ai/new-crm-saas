import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 📥 SHEET-LEAD-INTAKE v10 — Google Sheet (Meta native sync) -> CRM bridge
 * ═══════════════════════════════════════════════════════════════════════════
 * v10 (admin decision 2026-08-08) — WOMEN-ONLY FORM NOW FALLS BACK.
 *  v6 gave Simar's team EXCLUSIVE rights to the women-only form: if nobody
 *  under Simar was eligible, the lead was parked in 'Queued' forever. That
 *  was my own over-strict reading — the admin never asked for it, and it
 *  backfired live: Priya Bhatiya (the only active user under Simar) has a
 *  daily_limit of 9 while that form produces far more per day, so leads
 *  simply piled up in Queued. Nothing re-processes 'Queued' leads, so they
 *  would have rotted there permanently = paid-for leads nobody ever calls.
 *
 *  Correct rule (admin, verbatim): women's leads go to Simar's team FIRST;
 *  once their daily limit is full, the rest go to the other teams like any
 *  normal lead. No lead should ever sit in Queued.
 *
 *  So the women-only branch is now: Simar's team first → else normal pool.
 *  The reverse rule is UNCHANGED and still strict: leads from any OTHER
 *  form must never reach Simar's managed users.
 *
 * v9 (admin decision 2026-08-08) — CAPI match-quality upgrade, applied
 * identically in meta-webhook.ts's Lead event for consistency across both
 * intake channels:
 *  - action_source 'crm' -> 'system_generated'. 'crm' is NOT a valid Meta
 *    action_source enum value — send-crm-conversion v3 already discovered
 *    and fixed this exact bug for status-change events, but the fix was
 *    never ported to either channel's INITIAL 'Lead' event. Fixed here.
 *  - user_data enriched with ln (last name, split from name), st (state,
 *    now passed through), and external_id (hashed lead id) — the same
 *    match-key set send-crm-conversion already uses. More matched keys =
 *    higher Meta Event Match Quality = better ad-delivery optimization =
 *    lower cost-per-lead, which is the whole point of sending CAPI at all.
 *  - Deliberately did NOT add ad_id to the CAPI payload: Meta's CAPI schema
 *    has no ad_id match/attribution field for this event type — native
 *    Meta Lead Ads already attribute leads to the originating ad on Meta's
 *    own side automatically. ad_id capture (for OUR OWN internal
 *    cost-per-ad reporting) would need a new leads.ad_id column, which is
 *    a schema change requiring separate admin approval per CLAUDE.md rule 3
 *    — not done here.
 *
 * v8 (admin decision 2026-08-08) — two fixes, both scoped to THIS intake
 * channel only (meta-webhook / send-crm-conversion untouched):
 *  1. MUTUAL EXCLUSIVITY — admin confirmed a second form_id (also connected
 *     to this same sheet/system, a different page) exists and needs NO
 *     special routing of its own — it should flow through the normal team
 *     pool like any other lead. BUT explicitly: leads from any form OTHER
 *     than WOMEN_ONLY_FORM_ID must never land with users managed by
 *     SIMARJIT — that pool is reserved exclusively for the women-only form.
 *     Previously the normal (non-women's-form) branch called the shared
 *     get_best_assignee_for_team RPC directly, which had no way to exclude
 *     Simar's managed users (e.g. Priya Bhatiya was still eligible there).
 *     Fixed with a new inline helper, findTeamAssigneeExcludingManager,
 *     mirroring the RPC's exact eligibility/fairness logic (2-pass 60%/100%
 *     daily-limit gate, fill_ratio ASC + plan_weight DESC ordering) but
 *     additionally excluding SIMAR_MANAGER_ID — kept inline (not a shared
 *     RPC change) per CLAUDE.md rule 4.
 *  2. CAPI PIXEL CONSISTENCY — sendCapiLeadEvent previously matched the
 *     pixel using the intake token's static first-team label (always
 *     'ECO@WIN12'), regardless of who the lead actually got assigned to.
 *     Meanwhile the SAME lead's later status-change CAPI events (fired by
 *     the separate send-crm-conversion function) correctly match by the
 *     lead's actual assigned user's team_code — verified live this often
 *     resolves to TEAMFIRE's pixel, not ECO@WIN12's, since ECO@WIN12 has
 *     almost no active members and most sheet leads fall back to TEAMFIRE.
 *     Result: a single lead's CAPI events could be split across two
 *     different pixels, fragmenting Meta's optimization signal. Fixed —
 *     sendCapiLeadEvent now takes the actually-assigned user's ID, fetches
 *     their team_code fresh (same as send-crm-conversion does), and fans
 *     out to every matching active pixel_config row (same team_code-match +
 *     dedupe-by-pixel_id approach as send-crm-conversion), instead of a
 *     single `.find()` against a hardcoded label. This guarantees the
 *     initial 'Lead' event and every later status-change event for the
 *     same lead always land on the exact same pixel(s).
 *
 * v6 (admin decision 2026-08-08):
 *  1. FORM-BASED MANAGER ROUTING — form_id WOMEN_ONLY_FORM_ID (26784403284560247,
 *     confirmed 2026-08-08 from the real Meta ad's own form_id column — the
 *     earlier guess of 2419407918566414, inferred from an unrelated Apps
 *     Script column-mapping override comment, was WRONG and has been
 *     corrected) is women/girls-only leads. These must go ONLY to
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
// Confirmed 2026-08-08 from the real Meta ad's own form_id (screenshot).
const WOMEN_ONLY_FORM_ID = '26784403284560247';
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

// Same eligibility + fairness rule as get_best_assignee_for_team RPC
// (2-pass: <=60% daily limit first, then <=100%; fill_ratio ASC, plan_weight
// DESC), but additionally excludes anyone managed by `excludeManagerId`.
// Kept inline rather than modifying the shared RPC (CLAUDE.md rule 4) —
// this exclusion must ONLY apply to non-women's-form leads from this sheet
// intake channel, not to every caller of the RPC (e.g. meta-webhook).
async function findTeamAssigneeExcludingManager(supabase: any, teamCode: string, excludeManagerId: string) {
  const teamArray = teamCode.replace(/\s+/g, '').split(',');

  const { data: candidates } = await supabase
    .from('users')
    .select('id, name, email, daily_limit, total_leads_received, total_leads_promised, plan_weight, fresh_leads_quota, fresh_leads_received, manager_id')
    .in('team_code', teamArray)
    .eq('is_active', true)
    .eq('is_online', true)
    .in('role', ['member', 'manager'])
    .or(`manager_id.is.null,manager_id.neq.${excludeManagerId}`);

  if (!candidates || candidates.length === 0) return null;

  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const startOfDayIso = new Date(`${todayIST}T00:00:00+05:30`).toISOString();

  const pass1: { user: any; fillRatio: number; weight: number }[] = [];
  const pass2: { user: any; fillRatio: number; weight: number }[] = [];

  for (const u of candidates) {
    const promisedOk = !u.total_leads_promised || u.total_leads_received < u.total_leads_promised;
    if (!promisedOk) continue;
    const freshOk = !u.fresh_leads_quota || (u.fresh_leads_received || 0) < u.fresh_leads_quota;
    if (!freshOk) continue;

    const { count: todayCount } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', u.id)
      .gte('assigned_at', startOfDayIso);

    const cnt = todayCount || 0;
    const dailyLimit = u.daily_limit || 0;
    const weight = u.plan_weight || 1;

    if (dailyLimit <= 0 || cnt < Math.floor(dailyLimit * 0.6)) {
      const effLimit = dailyLimit > 0 ? Math.floor(dailyLimit * 0.6) : 1;
      pass1.push({ user: u, fillRatio: cnt / Math.max(effLimit, 1), weight });
    }
    if (dailyLimit <= 0 || cnt < dailyLimit) {
      pass2.push({ user: u, fillRatio: cnt / Math.max(dailyLimit, 1), weight });
    }
  }

  const pick = (arr: { user: any; fillRatio: number; weight: number }[]) => {
    if (arr.length === 0) return null;
    arr.sort((a, b) => a.fillRatio - b.fillRatio || b.weight - a.weight);
    return arr[0].user;
  };

  return pick(pass1) || pick(pass2);
}

// Sends the initial 'Lead' CAPI event, matched by pixel using the lead's
// ACTUAL assigned user's team_code (fetched fresh) — same matching rule
// send-crm-conversion uses for later status-change events on the same lead,
// so a lead's whole CAPI lifecycle always lands on the same pixel(s). Fans
// out to every matching active pixel (dedupe by pixel_id), not just one.
async function sendCapiLeadEvent(
  supabase: any,
  assignedUserId: string | null,
  leadId: string,
  name: string,
  phone: string,
  city: string,
  state: string | null
) {
  try {
    let teamCode: string | null = null;
    if (assignedUserId) {
      const { data: u } = await supabase.from('users').select('team_code').eq('id', assignedUserId).maybeSingle();
      teamCode = u?.team_code || null;
    }

    if (!teamCode) {
      console.log(`[CAPI] ⏭️ Skipped — could not resolve assigned user's team_code`);
      return;
    }

    const { data: pixelConfigs } = await supabase
      .from('pixel_config')
      .select('pixel_id, capi_access_token, team_code')
      .eq('is_active', true);

    const teamCodesOfLead = teamCode.split(',').map((t) => t.trim()).filter(Boolean);
    const matchedPixels = new Map<string, any>();

    if (pixelConfigs) {
      for (const config of pixelConfigs) {
        if (config.capi_access_token === 'PENDING_TOKEN') continue;
        const configTeams = (config.team_code || '').split(',').map((t: string) => t.trim()).filter(Boolean);
        const teamMatch = teamCodesOfLead.some((t) => configTeams.includes(t));
        if (teamMatch && !matchedPixels.has(config.pixel_id)) {
          matchedPixels.set(config.pixel_id, config);
        }
      }
    }

    if (matchedPixels.size === 0) {
      console.log(`[CAPI] ⏭️ Skipped — no pixel config matches team: ${teamCode}`);
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

    // Split full name into first + last for correct Meta matching (fn/ln) —
    // same convention as send-crm-conversion.
    const nameParts = (name || '').trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const hashedPhone = await hashValue(formatPhone(phone));
    const hashedFirst = firstName ? await hashValue(firstName) : '';
    const hashedLast = lastName ? await hashValue(lastName) : '';
    const hashedCity = city && city.toLowerCase() !== 'unknown' ? await hashValue(city) : '';
    const hashedState = state ? await hashValue(state) : '';
    const hashedCountry = await hashValue('in');
    const hashedExternalId = await hashValue(String(leadId));

    const userData: Record<string, any> = {
      ph: [hashedPhone],
      country: [hashedCountry],
      external_id: [hashedExternalId],
    };
    if (hashedFirst) userData.fn = [hashedFirst];
    if (hashedLast) userData.ln = [hashedLast];
    if (hashedCity) userData.ct = [hashedCity];
    if (hashedState) userData.st = [hashedState];

    for (const [pixelId, config] of matchedPixels) {
      const capiPayload = {
        data: [{
          event_name: 'Lead',
          event_id: `sheetlead_${leadId}_${pixelId}`,
          event_time: Math.floor(Date.now() / 1000),
          // Meta's action_source enum has no 'crm' value — 'crm' silently
          // mis-registers the event. 'system_generated' is the value Meta
          // documents for CRM/automation-triggered events (same fix already
          // applied in send-crm-conversion v3, ported here for consistency).
          action_source: 'system_generated',
          user_data: userData,
          custom_data: {
            event_source: 'crm',
            lead_event_source: 'LeadFlow CRM',
            currency: 'INR',
            value: 0,
          },
        }],
      };

      try {
        const capiResp = await fetch(
          `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${config.capi_access_token}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(capiPayload) }
        );
        const capiResult = await capiResp.json();
        console.log(`[CAPI] ✅ Pixel ${pixelId} | team: ${teamCode} | Result:`, JSON.stringify(capiResult));
      } catch (pixelErr: any) {
        console.error(`[CAPI] ❌ Pixel ${pixelId} error (non-fatal):`, pixelErr.message);
      }
    }
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
      // Women-only form: Simar's team gets FIRST REFUSAL, not exclusive rights.
      let target = await findManagerScopedAssignee(supabase, SIMAR_MANAGER_ID);

      // v10 (admin decision 2026-08-08): if nobody under Simar can take it
      // right now (daily limit reached, or no active user at all), the lead
      // goes to the normal team pool instead of sitting in Queued. Admin's
      // rule is explicit: no lead should ever be parked in Queued — a lead
      // nobody works is pure wasted ad spend. Priority is preserved because
      // Simar's team is always checked first.
      if (!target) {
        target = await findTeamAssigneeExcludingManager(supabase, teamCode, SIMAR_MANAGER_ID);
      }

      if (!target) {
        // Genuinely nobody left anywhere — every team is at capacity.
        await supabase.from('leads').insert({
          name, phone, city, state, source, status: 'Queued',
          notes: `Team ${teamCode} - all users at capacity`,
          lead_details: leadDetails, form_id: formId
        });
        return new Response(JSON.stringify({ status: 'queued_no_eligible_user' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      finalUserId = target.id;
      finalUserName = target.name;
    } else {
      // Mutual exclusivity (admin decision 2026-08-08): non-women's-form
      // leads must never land with Simar's managed users — that pool is
      // reserved exclusively for the women-only form above.
      const target = await findTeamAssigneeExcludingManager(supabase, teamCode, SIMAR_MANAGER_ID);

      if (!target) {
        await supabase.from('leads').insert({
          name, phone, city, state, source, status: 'Queued',
          notes: `Team ${teamCode} - all users at capacity`, lead_details: leadDetails, form_id: formId
        });
        return new Response(JSON.stringify({ status: 'queued_no_eligible_user' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      finalUserId = target.id;
      finalUserName = target.name;
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

    // ---- CAPI signal (non-critical, matched by the ACTUAL assigned user's team) ----
    await sendCapiLeadEvent(supabase, finalUserId, newLead.id, name, phone, city, state);

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
