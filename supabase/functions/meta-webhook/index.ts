
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * LEADFLOW WEBHOOK v31 - FINAL IRON DOME (MULTI-MANAGER SUPPORT)
 * 
 * FEATURES:
 * 1. STRICT ISOLATION: Leads from Page X -> ONLY to Team of Manager X.
 * 2. CORRECT QUOTA: Counts (user_id + assigned_to) to prevent leakage.
 * 3. NO OLD LEADS: Fresh leads only.
 * 4. FAIR ROTATION: Fewest leads first within strictly isolated team.
 */

const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || 'LeadFlow_Meta_2026_Premium';

const PLAN_LIMITS: { [key: string]: number } = {
    'starter': 55, 'supervisor': 115, 'manager': 176, 'weekly_boost': 92, 'turbo_boost': 108
};

// 5 Managers Supported Currently
const MANAGER_MAPPINGS: { [pageId: string]: string } = {
    // FORMAT: 'PAGE_ID': 'MANAGER_TEAM_CODE_PREFIX'
    // Example:
    // '123456789': 'TEAMFIRE',  (Himanshu)
    // '987654321': 'WIN',       (Kunal)
    // We will fetch real mapping from DB 'meta_pages' table which is cleaner.
};

const WORKING_HOURS = { START: 8, END: 22, TIMEZONE: 'Asia/Kolkata' };

function isWithinWorkingHours(): boolean {
    const now = new Date();
    const hour = parseInt(new Intl.DateTimeFormat('en-US', { hour: '2-digit', hour12: false, timeZone: WORKING_HOURS.TIMEZONE }).format(now));
    return hour >= WORKING_HOURS.START && hour < WORKING_HOURS.END;
}

function isValidIndianPhone(phone: string): boolean {
    return /^[6789]\d{9}$/.test(phone);
}

// ✅ FIXED QUOTA CHECK: Counts BOTH Owner + Assigned leads
async function hasQuotaRemaining(supabase: any, userId: string, planName: string): Promise<boolean> {
    const limit = PLAN_LIMITS[planName] || 0;
    if (limit === 0) return false;

    // 1. Get Payment Count
    const { data: payments } = await supabase.from('payments').select('id').eq('user_id', userId).eq('status', 'captured');
    const totalQuota = limit * (payments?.length || 1);

    // 2. Get Lead Count (Fixed Logic)
    // Count as owner
    const { count: c1 } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    // Count as assigned (but not owner)
    const { count: c2 } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('assigned_to', userId).neq('user_id', userId);

    const totalUsed = (c1 || 0) + (c2 || 0);

    return totalUsed < totalQuota;
}

async function getRealTodayCount(supabase: any, userId: string): Promise<number> {
    const startOfDay = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
    // Count leads assigned TODAY
    const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', userId) // Key change: Check assigned_to, not just user_id
        .gte('created_at', startOfDay);
    return count || 0;
}

serve(async (req) => {
    const url = new URL(req.url);
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    if (req.method === 'GET') {
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');
        if (mode === 'subscribe' && token === VERIFY_TOKEN) return new Response(challenge, { status: 200 });
        return new Response('Forbidden', { status: 403 });
    }

    if (req.method === 'POST') {
        try {
            const body = await req.json();
            for (const entry of body.entry || []) {
                for (const change of entry.changes || []) {
                    const leadData = change.value?.leadgen_id ? change.value : null;
                    if (!leadData) continue;

                    // 1. IDENTIFY MANAGER TEAM via Page ID
                    const pageId = leadData.page_id || entry.id;
                    // We need 'team_id' or 'manager_id' in meta_pages table
                    const { data: pageData } = await supabase.from('meta_pages').select('*').eq('page_id', pageId).single();

                    // CRITICAL ISOLATION LOGIC
                    const requiredTeamCode = pageData?.team_id; // e.g., 'TEAMFIRE' (Himanshu)
                    const pageName = pageData?.page_name || 'Unknown Page';

                    if (!requiredTeamCode) {
                        console.log(`⚠️ Page ${pageId} (${pageName}) has no Team ID mapped. Treating as ORPHAN/DEFAULT.`);
                        // FALLBACK: Don't assign or assign to Admin? 
                        // Current logic: Mark as New (No Assignment)
                        // This prevents wrong team assignment.
                    }

                    // Extract Fields
                    const formId = leadData.form_id;
                    const fields: Record<string, string> = {};
                    for (const f of leadData.field_data || []) { fields[f.name] = f.values?.[0] || ''; }
                    const name = fields.full_name || fields.name || 'Unknown';
                    const city = fields.city || '';
                    let rawPhone = fields.phone_number || fields.phoneNumber || fields.mobile || '';
                    if (!rawPhone) {
                        const k = Object.keys(fields).find(k => k.toLowerCase().match(/phone|mobile/));
                        if (k) rawPhone = fields[k];
                    }
                    const phone = (rawPhone || '').replace(/\D/g, '').slice(-10);

                    // Validations
                    if (name.toLowerCase().includes('test')) {
                        await supabase.from('leads').insert({ name: `[TEST] ${name}`, phone: 'TEST', city, source: `Meta - ${pageName}`, status: 'Test', form_id: formId });
                        continue;
                    }
                    if (!isValidIndianPhone(phone)) {
                        await supabase.from('leads').insert({ name, phone: phone || 'INVALID', city, source: `Meta - ${pageName}`, status: 'Invalid', form_id: formId });
                        continue;
                    }
                    const { data: dup } = await supabase.from('leads').select('id').eq('phone', phone).limit(1);
                    if (dup && dup.length > 0) {
                        await supabase.from('leads').insert({ name, phone, city, source: `Meta - ${pageName}`, status: 'Duplicate', form_id: formId });
                        continue;
                    }
                    if (!isWithinWorkingHours()) {
                        await supabase.from('leads').insert({ name, phone, city, source: `Meta - ${pageName}`, status: 'Night_Backlog', form_id: formId });
                        continue;
                    }

                    if (!requiredTeamCode) {
                        // Log lead but don't assign if we don't know whose team it is
                        await supabase.from('leads').insert({ name, phone, city, source: `Meta - ${pageName}`, status: 'New', form_id: formId, notes: 'No Team Mapped to Page' });
                        continue;
                    }

                    // 2. FETCH TEAM MEMBERS ONLY (Isolation)
                    // We check if user's team_code STARTS WITH or MATCHES the Page's Team ID
                    // This allows variations like 'TEAMFIRE_GUJ' to match 'TEAMFIRE' (if desired) OR strict match.
                    // Let's do STRICT match or Manager Check via user relation.

                    // Improved: Find Manager first
                    const { data: manager } = await supabase.from('users').select('id, team_code').eq('team_code', requiredTeamCode).eq('role', 'manager').single();

                    let teamUsersQuery = supabase.from('users')
                        .select('id, name, email, plan_name, daily_limit, team_code')
                        .eq('is_active', true)
                        .eq('is_online', true);

                    if (manager) {
                        // Option A: Get users via manager_id relationship (Best if relational)
                        // But if using string codes:
                        teamUsersQuery = teamUsersQuery.eq('team_code', manager.team_code).neq('role', 'manager');
                        // NOTE: If team members have different codes (e.g. sub-codes), this needs adjustment.
                        // Assuming all members of a team share the SAME team_code for now as per system design.
                    } else {
                        // Fallback: direct match on string
                        teamUsersQuery = teamUsersQuery.eq('team_code', requiredTeamCode).neq('role', 'manager');
                    }

                    const { data: teamUsers } = await teamUsersQuery;

                    if (!teamUsers || teamUsers.length === 0) {
                        console.log(`⚠️ No Online Users found for Team ${requiredTeamCode}`);
                        await supabase.from('leads').insert({ name, phone, city, source: `Meta - ${pageName}`, status: 'New', form_id: formId });
                        continue;
                    }

                    // 3. FILTER & SORT (Round Robin + Quota)
                    const eligibleUsers = [];
                    for (const user of teamUsers) {
                        // Real Daily Count
                        const todayCount = await getRealTodayCount(supabase, user.id);
                        if (todayCount >= (user.daily_limit || 0)) continue;

                        // Total Quota Check
                        const hasQuota = await hasQuotaRemaining(supabase, user.id, user.plan_name);
                        if (!hasQuota) {
                            // Stop & Skip
                            await supabase.from('users').update({ is_active: false }).eq('id', user.id);
                            continue;
                        }

                        eligibleUsers.push({ ...user, leads_today: todayCount });
                    }

                    if (eligibleUsers.length === 0) {
                        console.log(`⚠️ Team ${requiredTeamCode} Full/Quota reached.`);
                        await supabase.from('leads').insert({ name, phone, city, source: `Meta - ${pageName}`, status: 'New', form_id: formId });
                        continue;
                    }

                    // Sort: Fewest Leads -> Higher Plan
                    eligibleUsers.sort((a, b) => {
                        const diff = (a.leads_today || 0) - (b.leads_today || 0);
                        if (diff !== 0) return diff;
                        // Plan Weight
                        const getWeight = (p: string) => p?.includes('turbo') ? 100 : p?.includes('weekly') ? 90 : p?.includes('manager') ? 80 : 10;
                        return getWeight(b.plan_name) - getWeight(a.plan_name);
                    });

                    const targetUser = eligibleUsers[0];
                    const newCount = (targetUser.leads_today || 0) + 1;

                    console.log(`✅ Assigning ${phone} -> ${targetUser.name} [${requiredTeamCode}] (#${newCount})`);

                    // 4. ASSIGN
                    await supabase.from('leads').insert({
                        name, phone, city,
                        source: `Meta - ${pageName}`,
                        status: 'Assigned',
                        user_id: targetUser.id,
                        assigned_to: targetUser.id,
                        form_id: formId,
                        created_at: new Date().toISOString()
                    });

                    // Update Count
                    await supabase.from('users').update({ leads_today: newCount }).eq('id', targetUser.id);
                }
            }
            return new Response('Processed', { status: 200 });
        } catch (e) {
            console.error(e);
            return new Response(e.message, { status: 500 });
        }
    }
    return new Response('Method Not Allowed', { status: 405 });
});
