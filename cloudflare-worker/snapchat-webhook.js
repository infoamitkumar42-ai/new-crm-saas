/**
 * LeadFlow CRM — Snapchat Webhook Worker
 *
 * Flow: Google Apps Script → POST here → lead_sources lookup → assign_lead_round_robin RPC
 *
 * ENVIRONMENT VARIABLES (set in Cloudflare Dashboard for this Worker):
 *   SNAPCHAT_WEBHOOK_SECRET   — shared secret, must match X-Webhook-Secret header from GAS
 *   SUPABASE_URL              — https://vewqzsqddgmkslnuctvb.supabase.co (direct, not ISP proxy)
 *   SUPABASE_SERVICE_ROLE_KEY — service role JWT (never expose to frontend)
 *
 * NOTE: This is a SEPARATE Worker from the ISP-bypass proxy (worker.js).
 *       Do NOT merge them. Do NOT touch meta-webhook-v47.ts.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function sanitizePhone(raw) {
  // Strip all non-digits, take last 10 characters
  return String(raw || '').replace(/\D/g, '').slice(-10);
}

function isValidIndianPhone(phone) {
  if (!/^[6789]\d{9}$/.test(phone)) return false;
  if (/^(\d)\1{9}$/.test(phone)) return false; // reject 9999999999, 8888888888, etc.
  return true;
}

/**
 * Thin wrapper around Supabase REST API — always uses service role key.
 * Calls Supabase directly (not through ISP-bypass proxy) since service role bypasses ISP blocks.
 */
async function supabase(env, path, options = {}) {
  const url = `${env.SUPABASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      ...(options.headers || {}),
    },
  });
  return res;
}

// ── Per-lead processor ────────────────────────────────────────────────────────

async function processLead(lead, env) {
  const formId   = String(lead.formId   || '').trim();
  const formName = String(lead.formName || 'Unknown Form').trim();
  const rawPhone = String(lead.phoneNumber || '');
  const name     = String(lead.fullName    || 'Unknown Lead').trim();
  const city     = String(lead.customField1 || 'Unknown').trim();

  // 1. Server-side team resolution — NEVER trust team_code from client
  const srcRes = await supabase(
    env,
    `/rest/v1/lead_sources?source_key=eq.${encodeURIComponent(formId)}&select=team_code,is_active`,
    { method: 'GET', headers: { Accept: 'application/json' } }
  );

  if (!srcRes.ok) {
    return { phone: rawPhone, formId, status: 'Error', reason: 'lead_sources lookup failed' };
  }

  const srcRows = await srcRes.json();

  if (!srcRows.length) {
    // Unknown formId — not registered in lead_sources
    return { phone: rawPhone, formId, status: 'Skipped', reason: 'formId not registered in lead_sources' };
  }

  if (!srcRows[0].is_active) {
    return { phone: rawPhone, formId, status: 'Skipped', reason: 'source is inactive' };
  }

  // Split 'TEAMFIRE,TEAMSIMRAN' → ['TEAMFIRE', 'TEAMSIMRAN']
  const teamCodes = srcRows[0].team_code
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const source = `Snapchat - ${formName}`;

  // 2. Phone sanitize + validate
  const phone = sanitizePhone(rawPhone);

  if (!isValidIndianPhone(phone)) {
    // Distinguish reason for audit log
    const invalidReason = /^(\d)\1{9}$/.test(phone)
      ? 'Fake number (all same digits)'
      : 'Not a valid Indian mobile number';
    // Store as Invalid for audit — does NOT go through RPC (no assignment)
    await supabase(env, '/rest/v1/leads', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        name,
        phone: rawPhone || 'INVALID',
        city,
        source,
        form_id: formId,
        status: 'Invalid',
      }),
    });
    return { phone: rawPhone, formId, status: 'Invalid', reason: invalidReason };
  }

  // 3. Call assign_lead_round_robin RPC
  //    Trigger trigger_update_user_lead_count handles leads_today + total_leads_received automatically.
  //    This RPC is SECURITY DEFINER — service role key required.
  const rpcRes = await supabase(env, '/rest/v1/rpc/assign_lead_round_robin', {
    method: 'POST',
    body: JSON.stringify({
      p_name:       name,
      p_phone:      phone,
      p_city:       city,
      p_source:     source,
      p_form_id:    formId,
      p_team_codes: teamCodes,
    }),
  });

  if (!rpcRes.ok) {
    const errText = await rpcRes.text();
    return {
      phone,
      formId,
      status: 'Error',
      reason: `RPC error ${rpcRes.status}: ${errText.slice(0, 200)}`,
    };
  }

  const rpcResult = await rpcRes.json();
  return {
    phone,
    formId,
    status:      rpcResult.status,
    lead_id:     rpcResult.lead_id     || null,
    assigned_to: rpcResult.assigned_to || null,
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    // POST only
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method Not Allowed' }, 405);
    }

    // Validate shared secret
    const incomingSecret = request.headers.get('X-Webhook-Secret');
    if (!incomingSecret || incomingSecret !== env.SNAPCHAT_WEBHOOK_SECRET) {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }

    // Parse JSON body (single object OR array)
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    const leads = Array.isArray(body) ? body : [body];

    // Process leads sequentially — safe with FOR UPDATE SKIP LOCKED in RPC
    const results = [];
    for (const lead of leads) {
      try {
        const result = await processLead(lead, env);
        results.push(result);
      } catch (err) {
        results.push({ status: 'Error', reason: err.message || String(err) });
      }
    }

    // Always return 200 with per-lead results.
    // Google Apps Script marks the row as Synced on 200.
    // Individual lead errors (Invalid, Skipped, RPC Error) are logged in results[].
    return jsonResponse({ processed: results.length, results });
  },
};
