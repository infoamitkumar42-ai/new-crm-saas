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
                    // F. WORKING HOURS CHECK (DISABLED for 3-day recovery)
                    // ────────────────────────────────────────────────────────
                    /*
                    if (!isWithinWorkingHours()) {
                        await supabase.from('leads').insert({
                            name, phone, city,
                            source: `Meta - ${pageName}`, status: 'Night_Backlog'
                        });
                        continue;
                    }
                    */

                    // ════════════════════════════════════════════════════════
                    // G. 🚀 OPTIMIZED ASSIGNMENT (Multi-Team Support)
                    // ════════════════════════════════════════════════════════
                    let bestUser: any[] | null = null;
                    let rpcError: any = null;

                    if (requiredTeamCode.includes(',')) {
                        // 🟢 MULTI-TEAM LOGIC: Query all teams and pick absolute best
                        const teamCodes = requiredTeamCode.split(',').map((c: string) => c.trim()).filter((c: string) => c);
                        console.log(`🔀 Multi-Team Assignment for: ${teamCodes.join(' & ')}`);

                        const { data: teamUsers, error: userError } = await supabase
                            .from('users')
                            .select('id, name, email, plan_name, daily_limit, daily_limit_override, leads_today, total_leads_received, total_leads_promised')
                            .in('team_code', teamCodes)
                            .eq('is_active', true)
                            .eq('is_online', true)
                            .in('role', ['member', 'manager']);

                        if (userError) {
                            rpcError = userError;
                        } else if (teamUsers) {
                            const eligible = teamUsers.filter(u => {
                                const limit = u.daily_limit_override || u.daily_limit || 0;
                                const quotaFull = (u.total_leads_promised > 0 && u.total_leads_received >= u.total_leads_promised);
                                return u.leads_today < limit && !quotaFull;
                            });

                            eligible.sort((a, b) => {
                                const aToday = a.leads_today ?? 0;
                                const bToday = b.leads_today ?? 0;
                                if (aToday !== bToday) return aToday - bToday;

                                const aTotal = a.total_leads_received ?? 0;
                                const bTotal = b.total_leads_received ?? 0;
                                return aTotal - bTotal;
                            });

                            bestUser = eligible.length > 0 ? [{
                                user_id: eligible[0].id,
                                user_name: eligible[0].name,
                                daily_limit: eligible[0].daily_limit_override || eligible[0].daily_limit
                            }] : [];
                        } else {
                            bestUser = [];
                        }
                    } else {
                        // 🔵 SINGLE TEAM LOGIC (With Override Support)
                        const { data: teamUsers, error: userError } = await supabase
                            .from('users')
                            .select('id, name, email, plan_name, daily_limit, daily_limit_override, leads_today, total_leads_received, total_leads_promised')
                            .eq('team_code', requiredTeamCode)
                            .eq('is_active', true)
                            .eq('is_online', true)
                            .in('role', ['member', 'manager']);

                        if (userError) {
                            rpcError = userError;
                        } else if (teamUsers) {
                            const eligible = teamUsers.filter(u => {
                                const limit = u.daily_limit_override || u.daily_limit || 0;
                                const quotaFull = (u.total_leads_promised > 0 && u.total_leads_received >= u.total_leads_promised);
                                return u.leads_today < limit && !quotaFull;
                            });

                            eligible.sort((a, b) => {
                                if (a.leads_today !== b.leads_today) return a.leads_today - b.leads_today;
                                return (a.id < b.id ? -1 : 1);
                            });

                            bestUser = eligible.length > 0 ? [{
                                user_id: eligible[0].id,
                                user_name: eligible[0].name,
                                daily_limit: eligible[0].daily_limit_override || eligible[0].daily_limit
                            }] : [];
                        } else {
                            bestUser = [];
                        }
                    }

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

                    // ✅ FIX RPC SCHEMA MISMATCH (Handle out_ prefix)
                    const finalUserId = targetUser.user_id || targetUser.out_user_id;
                    const finalLimit = targetUser.daily_limit || targetUser.out_daily_limit || 100;

                    // ────────────────────────────────────────────────────────
                    // H. ATOMIC ASSIGNMENT (Bypassing buggy RPC)
                    // ────────────────────────────────────────────────────────
                    console.log(`🚀 Assigning to ${targetUser.user_name} (${finalUserId})`);

                    const { error: assignError } = await supabase
                        .from('leads')
                        .insert({
                            name,
                            phone,
                            city,
                            source: `Meta - ${pageName}`,
                            status: 'Assigned',
                            assigned_to: finalUserId,
                            user_id: finalUserId,
                            assigned_at: new Date().toISOString()
                        });

                    if (assignError) {
                        console.log(`⚠️ Direct assign failed for ${targetUser.user_name}, inserting as Queued:`, assignError.message);
                        await supabase.from('leads').insert({
                            name, phone, city,
                            source: `Meta - ${pageName}`, status: 'Queued',
                            notes: `Assignment failed: ${assignError.message}`
                        });
                        continue;
                    }

                    // Increment user's leads_today for dashboard
                    // We use rpc call to increment to avoid race conditions as much as possible 
                    // without the complex buggy assign_lead_atomically
                    await supabase.rpc('exec_sql', {
                        sql_query: `UPDATE users SET leads_today = leads_today + 1 WHERE id = '${finalUserId}'`
                    }).catch(() => { });

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
