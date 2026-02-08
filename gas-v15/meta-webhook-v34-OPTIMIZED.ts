import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🚀 LEADFLOW WEBHOOK v34 - OPTIMIZED (KILL SWITCH REMOVED, RPC-BASED)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * FIXES APPLIED:
 * 1. ❌ REMOVED: Auto-disable (is_active: false) when quota full
 * 2. ✅ ADDED: Single RPC call (get_best_assignee_for_team) replaces N+1 loop
 * 3. ✅ ADDED: Robust field extraction with multiple fallbacks
 * 4. ✅ ADDED: Graceful error handling (no silent failures)
 * 5. ✅ ADDED: lead_queue fallback when no eligible users
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || 'LeadFlow_Meta_2026_Premium';
const WORKING_HOURS = { START: 8, END: 22, TIMEZONE: 'Asia/Kolkata' };

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function isWithinWorkingHours(): boolean {
    const now = new Date();
    const hour = parseInt(new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        hour12: false,
        timeZone: WORKING_HOURS.TIMEZONE
    }).format(now));
    return hour >= WORKING_HOURS.START && hour < WORKING_HOURS.END;
}

function isValidIndianPhone(phone: string): boolean {
    return /^[6789]\d{9}$/.test(phone);
}

// ✅ ROBUST FIELD EXTRACTION (Handles multiple key variations)
function extractField(fields: Record<string, string>, ...keys: string[]): string {
    for (const key of keys) {
        if (fields[key] && fields[key].trim()) return fields[key].trim();
    }
    // Dynamic fallback: search for partial matches
    for (const key of Object.keys(fields)) {
        const lowerKey = key.toLowerCase();
        for (const searchKey of keys) {
            if (lowerKey.includes(searchKey.toLowerCase())) {
                return fields[key]?.trim() || '';
            }
        }
    }
    return '';
}

function sanitizePhone(raw: string): string {
    return (raw || '').replace(/\D/g, '').slice(-10);
}

// ============================================================================
// MAIN WEBHOOK HANDLER
// ============================================================================

serve(async (req) => {
    const url = new URL(req.url);
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ────────────────────────────────────────────────────────────────────────
    // 1. VERIFICATION (Facebook Webhook Challenge)
    // ────────────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ Webhook verified successfully');
            return new Response(challenge, { status: 200 });
        }
        return new Response('Forbidden', { status: 403 });
    }

    // ────────────────────────────────────────────────────────────────────────
    // 2. LEAD PROCESSING
    // ────────────────────────────────────────────────────────────────────────
    if (req.method === 'POST') {
        const processingStart = Date.now();
        let leadsProcessed = 0;
        let leadsAssigned = 0;

        try {
            const body = await req.json();

            for (const entry of body.entry || []) {
                for (const change of entry.changes || []) {
                    const leadData = change.value?.leadgen_id ? change.value : null;
                    if (!leadData) continue;

                    leadsProcessed++;
                    const leadId = leadData.leadgen_id;
                    const pageId = leadData.page_id || entry.id;

                    // ────────────────────────────────────────────────────────
                    // A. FETCH PAGE SETTINGS
                    // ────────────────────────────────────────────────────────
                    const { data: pageData, error: pageError } = await supabase
                        .from('meta_pages')
                        .select('*')
                        .eq('page_id', pageId)
                        .single();

                    if (pageError || !pageData) {
                        console.error(`❌ Page ${pageId} not found in meta_pages`);
                        await logError(supabase, 'PAGE_NOT_FOUND', { pageId, leadId });
                        continue;
                    }

                    const requiredTeamCode = pageData.team_id;
                    const pageName = pageData.page_name || 'Unknown Page';
                    const accessToken = pageData.access_token;

                    if (!requiredTeamCode) {
                        console.log(`⚠️ Page ${pageId} (${pageName}) has no Team ID mapped.`);
                        await logError(supabase, 'NO_TEAM_MAPPED', { pageId, pageName });
                        continue;
                    }

                    // ────────────────────────────────────────────────────────
                    // B. DATA RETRIEVAL (Payload or Graph API)
                    // ────────────────────────────────────────────────────────
                    let fields: Record<string, string> = {};

                    if (leadData.field_data && leadData.field_data.length > 0) {
                        for (const f of leadData.field_data) {
                            fields[f.name] = f.values?.[0] || '';
                        }
                    } else if (accessToken) {
                        console.log(`🔄 Fetching Lead ${leadId} via Graph API...`);
                        try {
                            const graphUrl = `https://graph.facebook.com/v18.0/${leadId}?fields=field_data,created_time&access_token=${accessToken}`;
                            const graphRes = await fetch(graphUrl);
                            const graphJson = await graphRes.json();

                            if (graphJson.error) {
                                console.error(`❌ Graph API Error:`, graphJson.error);
                                await logError(supabase, 'GRAPH_API_ERROR', { leadId, error: graphJson.error });
                                continue;
                            }
                            for (const f of graphJson.field_data || []) {
                                fields[f.name] = f.values?.[0] || '';
                            }
                        } catch (graphErr) {
                            console.error(`❌ Graph API Fetch Failed:`, graphErr);
                            continue;
                        }
                    } else {
                        console.log(`⚠️ No field data and no access token for Lead ${leadId}`);
                        continue;
                    }

                    // ────────────────────────────────────────────────────────
                    // C. NORMALIZE DATA (Robust Extraction)
                    // ────────────────────────────────────────────────────────
                    const name = extractField(fields, 'full_name', 'name', 'first_name') || 'Unknown Lead';
                    const city = extractField(fields, 'city', 'location', 'town', 'address') || 'Unknown';
                    const rawPhone = extractField(fields, 'phone_number', 'phoneNumber', 'phone', 'mobile', 'contact');
                    const phone = sanitizePhone(rawPhone);

                    // ────────────────────────────────────────────────────────
                    // D. VALIDATION
                    // ────────────────────────────────────────────────────────
                    if (name.toLowerCase().includes('test')) {
                        console.log(`⏭️ Skipping test lead: ${name}`);
                        continue;
                    }

                    if (!isValidIndianPhone(phone)) {
                        console.log(`⏭️ Invalid phone: ${phone}`);
                        await supabase.from('leads').insert({
                            name, phone: phone || 'INVALID', city,
                            source: `Meta - ${pageName}`, status: 'Invalid'
                        });
                        continue;
                    }

                    // ────────────────────────────────────────────────────────
                    // E. DUPLICATE CHECK
                    // ────────────────────────────────────────────────────────
                    const { data: dup } = await supabase
                        .from('leads')
                        .select('id')
                        .eq('phone', phone)
                        .limit(1);

                    if (dup && dup.length > 0) {
                        console.log(`♻️ Duplicate: ${phone}`);
                        await supabase.from('leads').insert({
                            name, phone, city,
                            source: `Meta - ${pageName}`, status: 'Duplicate'
                        });
                        continue;
                    }

                    // ────────────────────────────────────────────────────────
                    // F. WORKING HOURS CHECK
                    // ────────────────────────────────────────────────────────
                    if (!isWithinWorkingHours()) {
                        await supabase.from('leads').insert({
                            name, phone, city,
                            source: `Meta - ${pageName}`, status: 'Night_Backlog'
                        });
                        continue;
                    }

                    // ════════════════════════════════════════════════════════
                    // G. 🚀 OPTIMIZED ASSIGNMENT (Single RPC Call)
                    // ════════════════════════════════════════════════════════
                    const { data: bestUser, error: rpcError } = await supabase
                        .rpc('get_best_assignee_for_team', { p_team_code: requiredTeamCode });

                    if (rpcError) {
                        console.error(`❌ RPC Error:`, rpcError);
                        await logError(supabase, 'RPC_ERROR', { team: requiredTeamCode, error: rpcError.message });
                        // Fallback: Insert as unassigned
                        await supabase.from('leads').insert({
                            name, phone, city,
                            source: `Meta - ${pageName}`, status: 'New',
                            notes: 'RPC Error - Manual Assignment Required'
                        });
                        continue;
                    }

                    if (!bestUser || bestUser.length === 0) {
                        console.log(`⚠️ No eligible users for Team ${requiredTeamCode}`);
                        // Insert to queue for later processing
                        await supabase.from('leads').insert({
                            name, phone, city,
                            source: `Meta - ${pageName}`, status: 'Queued',
                            notes: `Team ${requiredTeamCode} - All users at capacity`
                        });
                        continue;
                    }

                    const targetUser = bestUser[0];

                    // ────────────────────────────────────────────────────────
                    // H. ATOMIC ASSIGNMENT (Race-Condition Safe)
                    // ────────────────────────────────────────────────────────
                    const { data: assignResult, error: assignError } = await supabase
                        .rpc('assign_lead_atomically', {
                            p_lead_name: name,
                            p_phone: phone,
                            p_city: city,
                            p_source: `Meta - ${pageName}`,
                            p_status: 'Assigned',
                            p_user_id: targetUser.user_id,
                            p_planned_limit: targetUser.daily_limit || 100
                        });

                    if (assignError || !assignResult?.[0]?.success) {
                        console.log(`⚠️ Atomic assign failed for ${targetUser.user_name}, inserting as Queued`);
                        await supabase.from('leads').insert({
                            name, phone, city,
                            source: `Meta - ${pageName}`, status: 'Queued',
                            notes: 'Atomic assignment failed - retry needed'
                        });
                        continue;
                    }

                    leadsAssigned++;
                    console.log(`✅ ASSIGNED: ${name} (${phone}) -> ${targetUser.user_name} [${requiredTeamCode}]`);
                }
            }

            const processingTime = Date.now() - processingStart;
            console.log(`📊 Processed: ${leadsProcessed}, Assigned: ${leadsAssigned}, Time: ${processingTime}ms`);

            return new Response(JSON.stringify({
                status: 'success',
                processed: leadsProcessed,
                assigned: leadsAssigned,
                time_ms: processingTime
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

        } catch (e: any) {
            console.error("❌ Webhook Fatal Error:", e.message);
            await logError(supabase, 'FATAL_ERROR', { message: e.message, stack: e.stack });
            return new Response(JSON.stringify({ error: e.message }), { status: 500 });
        }
    }

    return new Response('Method Not Allowed', { status: 405 });
});

// ============================================================================
// ERROR LOGGING (No Silent Failures)
// ============================================================================

async function logError(supabase: any, errorType: string, details: any) {
    try {
        await supabase.from('webhook_errors').insert({
            error_type: errorType,
            details: details,
            created_at: new Date().toISOString()
        });
    } catch (e) {
        console.error('Failed to log error to DB:', e);
    }
}
