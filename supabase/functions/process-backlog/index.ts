import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ----------------------------------------------------------------------
// FORM-BASED MANAGER ROUTING (added 2026-08-08)
// Mirrors the rule already live in sheet-lead-intake v10, so a lead gets
// the SAME routing whether it is assigned at intake time or later by this
// backlog sweeper. Without this, the backlog path was a hole in the rule:
// a normal-form lead that happened to queue could be handed to one of
// Simar's managed users the next morning.
//
//  - women-only form  -> Simar's team gets FIRST REFUSAL, then everyone
//                        else (fallback, so leads never rot in the queue)
//  - any other form   -> Simar's managed users are EXCLUDED entirely
//
// Deliberately applied ONLY when the lead actually has a form_id. Leads
// created before the Apps Script started forwarding form_id (2026-08-08
// ~15:40 IST) have form_id NULL and could belong to either form — guessing
// would either starve Simar's team or leak leads to it, so those keep the
// exact pre-existing behaviour. That legacy set only shrinks over time.
// ----------------------------------------------------------------------
const WOMEN_ONLY_FORM_ID = '26784403284560247';
const SIMAR_MANAGER_ID = 'acaf3c4d-22bf-43eb-b91d-eae0d6af9f76'; // simar@forever.com

// v2 (admin decision 2026-08-10): pawangoyal1927@gmail.com (Priya Goyal,
// team_code=TEAMFIRE, NOT managed by Simar) gets the same women-only-form
// priority + other-form exclusion as Simar's managed team — mirrors the
// identical change made in sheet-lead-intake v11. Kept as an explicit
// user-id list rather than changing her manager_id (would incorrectly
// move her under Simar for reporting purposes elsewhere in the app).
const EXTRA_WOMEN_FORM_USER_IDS = ['6ded9043-7fe7-4143-b31a-a26eac338309']; // pawangoyal1927@gmail.com
const isSimarScoped = (u: { manager_id?: string; id: string }) =>
    u.manager_id === SIMAR_MANAGER_ID || EXTRA_WOMEN_FORM_USER_IDS.includes(u.id);

// ----------------------------------------------------------------------
// HELPER: Infer State from Phone (Simplified Copy)
// ----------------------------------------------------------------------
function inferStateFromPhone(phone: string): string {
    if (!phone) return 'Unknown';
    const p = phone.replace('+91', '').trim();

    const startingDigits = p.substring(0, 4);
    const start2 = p.substring(0, 2);

    if (['9814', '9815', '9872', '9876', '9878', '9914', '9915', '9988', '9417', '9463', '9464', '9465', '8146', '8194', '9501', '9855'].some(pre => p.startsWith(pre))) return 'Punjab';
    if (['9810', '9811', '9818', '9868', '9871', '9910', '9958', '9999'].some(pre => p.startsWith(pre))) return 'Delhi';
    if (['9812', '9813', '9896', '9991', '9992', '9416', '9466', '9467'].some(pre => p.startsWith(pre))) return 'Haryana';

    return 'Unknown';
}

// ----------------------------------------------------------------------
// HELPER: Resolve which team(s) a lead belongs to, purely from its
// `source` string. Generic for ANY team (present or future) instead of
// the old hardcoded Himanshu/Simran-only check.
//
//  - "GoogleSheet-<TEAM_CODE>"  -> team_code taken directly from source
//  - "Meta - <page name>"      -> looked up in meta_pages (same table
//                                  meta-webhook itself uses), matched by
//                                  substring like the existing CAPI code
//
// Returns null when unresolved (e.g. unusual/legacy source strings) --
// in that case NO team filter is applied, same permissive fallback the
// function already had before this fix, so nothing that worked before
// regresses.
// ----------------------------------------------------------------------
function resolveTeamCodes(source: string, metaPages: { page_name: string; team_id: string }[]): string[] | null {
    if (!source) return null;

    if (source.startsWith('GoogleSheet-')) {
        const tc = source.replace('GoogleSheet-', '').trim();
        return tc ? [tc] : null;
    }

    if (source.startsWith('Meta - ')) {
        const pageName = source.replace('Meta - ', '').trim().toLowerCase();
        for (const p of metaPages) {
            const configPage = (p.page_name || '').toLowerCase();
            if (pageName.includes(configPage) || configPage.includes(pageName)) {
                return (p.team_id || '').split(',').map(t => t.trim()).filter(Boolean);
            }
        }
    }

    return null;
}
// ----------------------------------------------------------------------

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        console.log('🧹 Backlog Sweeper Started...')

        // 0. 10 AM IST Time Gate — only run after 10 AM IST
        const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const hourIST = nowIST.getHours();
        if (hourIST < 10) {
            console.log(`⏰ Time gate: ${hourIST}:xx IST — too early, backlog runs after 10 AM IST`);
            return new Response(JSON.stringify({ message: 'Too early — runs after 10 AM IST', hour_ist: hourIST }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 1. Fetch 'New' Leads (Oldest First)
        const { data: leads, error: leadsError } = await supabase
            .from('leads')
            .select('*')
            .in('status', ['New', 'Night_Backlog', 'Queued'])
            .order('created_at', { ascending: true })
            .limit(100);

        if (leadsError) throw leadsError
        if (!leads || leads.length === 0) {
            console.log('✅ queue empty')
            return new Response(JSON.stringify({ message: 'Queue Empty', count: 0 }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        console.log(`📦 Processing ${leads.length} stuck leads...`);

        // 1b. Fetch meta_pages ONCE — used to resolve team_code for "Meta - ..." sources
        const { data: metaPages } = await supabase.from('meta_pages').select('page_name, team_id');

        // 2. Fetch Active Users
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .eq('is_active', true)
            .neq('plan_name', 'none')
            .or('is_plan_pending.is.null,is_plan_pending.eq.false');

        if (usersError) throw usersError

        let firstLeadRejections = { capacity: 0, team: 0, state: 0, form: 0, total_users: users.length };

        let distributedCount = 0;

        // 3. Process Each Lead
        for (let i = 0; i < leads.length; i++) {
            const lead = leads[i];

            // A. Determine Context — team_code(s) this lead is allowed to go to
            const teamCodes = resolveTeamCodes(lead.source, metaPages || []);
            let leadState = lead.state;

            // Form-based routing context (see header note). Only meaningful
            // when the lead actually carries a form_id.
            const leadFormId = lead.form_id || null;
            const isWomenOnlyForm = leadFormId === WOMEN_ONLY_FORM_ID;

            // Infer State
            if (!leadState || leadState === 'Unknown') {
                leadState = inferStateFromPhone(lead.phone);
            }

            // B. Filter Eligible Users
            let eligible = users.filter(u => {
                // 1. Daily Capacity
                const limit = u.daily_limit || 0;
                const current = u.leads_today || 0;
                if (current >= limit) {
                    if (i === 0) firstLeadRejections.capacity++;
                    return false;
                }

                // 2. Total Quota (total_leads_received < total_leads_promised)
                const totalPromised = u.total_leads_promised || 0;
                const totalReceived = u.total_leads_received || 0;
                if (totalPromised > 0 && totalReceived >= totalPromised) {
                    if (i === 0) firstLeadRejections.capacity++;
                    return false;
                }

                // 3. Team (generic — replaces old hardcoded Himanshu/Simran-only logic)
                if (teamCodes && teamCodes.length > 0) {
                    if (!teamCodes.includes(u.team_code)) {
                        if (i === 0) firstLeadRejections.team++;
                        return false;
                    }
                }
                // If teamCodes is null (unresolved source), no team filter is applied —
                // same permissive fallback as before this fix.

                // 3b. Form-based exclusion — leads from any form OTHER than the
                // women-only form must never reach Simar's managed users.
                // (Skipped entirely when form_id is unknown; see header note.)
                if (leadFormId && !isWomenOnlyForm && isSimarScoped(u)) {
                    if (i === 0) firstLeadRejections.form++;
                    return false;
                }

                // 4. State
                if (leadState && leadState !== 'Unknown') {
                    const userFilters = u.filters || {};
                    const isPanIndia = userFilters.panIndia === true || userFilters.pan_india === true;

                    if (isPanIndia) return true;

                    const allowedStates = userFilters.states || [];
                    const hasState = allowedStates.some((s: string) => s.toLowerCase() === leadState.toLowerCase());

                    if (hasState) return true;

                    if (u.target_state === 'All India') return true;

                    if (i === 0) firstLeadRejections.state++;
                    return false;
                }

                return true;
            });

            if (eligible.length === 0) {
                continue;
            }

            // B2. Women-only form: Simar's team gets FIRST REFUSAL. If at least
            // one of their users is still eligible, narrow the pool to them.
            // If none are (daily limit full / nobody active), the full pool is
            // kept so the lead still goes out instead of sitting in the queue —
            // exactly the fallback rule live in sheet-lead-intake v10.
            if (isWomenOnlyForm) {
                const simarFirst = eligible.filter(isSimarScoped);
                if (simarFirst.length > 0) {
                    eligible = simarFirst;
                }
            }

            // C. Sort (Equalizer Strategy: Round Robin 1->2, 2->3)
            eligible.sort((a, b) => {
                const leadsA = a.leads_today || 0;
                const leadsB = b.leads_today || 0;

                if (leadsA !== leadsB) return leadsA - leadsB;

                const pendingA = (a.daily_limit || 0) - leadsA;
                const pendingB = (b.daily_limit || 0) - leadsB;
                return pendingB - pendingA;
            });

            // D. Assign (With Concurrency Check)
            let selectedUser = null;

            for (let candidate of eligible) {
                const { data: freshUser, error: freshErr } = await supabase
                    .from('users')
                    .select('leads_today, daily_limit')
                    .eq('id', candidate.id)
                    .single();

                if (freshErr || !freshUser) continue;

                const freshCurrent = freshUser.leads_today || 0;
                const freshLimit = freshUser.daily_limit || 0;

                if (freshCurrent < freshLimit) {
                    candidate.leads_today = freshCurrent;
                    selectedUser = candidate;
                    break;
                } else {
                    console.log(`⚠️ Backlog Race condition: ${candidate.name} full. Skipping.`);
                }
            }

            if (!selectedUser) {
                console.log('⚠️ All users filled up (Backlog race)');
                continue;
            }

            const { error: assignError, data: updateData } = await supabase
                .from('leads')
                .update({
                    status: 'Assigned',
                    user_id: selectedUser.id,
                    assigned_to: selectedUser.id,
                    assigned_at: new Date().toISOString()
                })
                .eq('id', lead.id)
                .in('status', ['New', 'Night_Backlog', 'Queued'])
                .select();

            if (!assignError && updateData && updateData.length > 0) {
                console.log(`✅ Assigned ${lead.phone.slice(-4)} -> ${selectedUser.name}`);

                selectedUser.leads_today = (selectedUser.leads_today || 0) + 1;
                distributedCount++;
            }
        }

        return new Response(JSON.stringify({
            message: 'Success',
            distributed: distributedCount,
            debug: {
                leads_found: leads.length,
                users_active: users.length,
                first_lead_stats: firstLeadRejections
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error('❌ Error:', error.message)
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
    }
})
