import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 📥 SHEET-LEAD-INTAKE v5 — Google Sheet (Meta native sync) -> CRM bridge
 * ═══════════════════════════════════════════════════════════════════════════
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
 * best-assignee lookup -> insert -> push notification.
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
    // ban jata hai jo reporting mein confusing hai.
    const sourceTeamLabel = teamCode.split(',')[0].trim();

    const body = await req.json();
    const name = (body.name || 'Unknown Lead').toString().trim();
    const city = (body.city || 'Unknown').toString().trim();
    const state = (body.state || '').toString().trim() || null;
    const source = (body.source || `GoogleSheet-${sourceTeamLabel}`).toString().trim();
    const phone = sanitizePhone(body.phone);
    const leadDetails = buildLeadDetails(body);

    // ---- Invalid phone ----
    if (!isValidIndianPhone(phone)) {
      await supabase.from('leads').insert({
        name, phone: phone || 'INVALID', city, state, source, status: 'Invalid', lead_details: leadDetails
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
      await supabase.from('leads').insert({ name, phone, city, state, source, status: 'Night_Backlog', lead_details: leadDetails });
      return new Response(JSON.stringify({ status: 'night_backlog' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ---- Assign via the SAME RPC meta-webhook uses ----
    const { data: bestUser, error: rpcError } = await supabase
      .rpc('get_best_assignee_for_team', { p_team_code: teamCode });

    if (rpcError || !bestUser || bestUser.length === 0) {
      await supabase.from('leads').insert({
        name, phone, city, state, source, status: 'Queued',
        notes: `Team ${teamCode} - all users at capacity`, lead_details: leadDetails
      });
      return new Response(JSON.stringify({ status: 'queued_no_eligible_user' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const target = bestUser[0];
    const finalUserId = target.user_id || target.out_user_id;

    const { error: assignError } = await supabase.from('leads').insert({
      name, phone, city, state, source,
      status: 'Assigned',
      assigned_to: finalUserId,
      user_id: finalUserId,
      assigned_at: new Date().toISOString(),
      lead_type: 'fresh',
      recycle_count: 0,
      lead_details: leadDetails
    });

    if (assignError) {
      await supabase.from('leads').insert({ name, phone, city, state, source, status: 'Queued', lead_details: leadDetails });
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

    return new Response(JSON.stringify({ status: 'assigned', assigned_to: target.user_name || finalUserId }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    console.error('sheet-lead-intake error:', e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
