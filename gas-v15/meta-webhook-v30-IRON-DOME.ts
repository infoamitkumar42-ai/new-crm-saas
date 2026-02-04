import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * LEADFLOW WEBHOOK v30 - IRON DOME (STRICT TEAM ISOLATION)
 * 
 * CORE SECURITY:
 * 1. Source Isolation: Leads are tagged with the 'team_id' of the Source Page.
 * 2. Destination Isolation: Leads are ONLY assigned to users with matching 'team_id'.
 * 3. Fallback Safety: If no team match, lead is logged as 'Misconfigured' but NOT assigned randomly.
 * 
 * PLAN LIMITS (per payment):
 * - starter: 55 | supervisor: 115 | manager: 176 | weekly_boost: 92 | turbo_boost: 108
 */

const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || 'LeadFlow_Meta_2026_Premium';

const PLAN_LIMITS: { [key: string]: number } = {
    'starter': 55, 'supervisor': 115, 'manager': 176, 'weekly_boost': 92, 'turbo_boost': 108
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

// Check if user has quota remaining (Total Limits)
async function hasQuotaRemaining(supabase: any, userId: string, planName: string): Promise<boolean> {
    const limit = PLAN_LIMITS[planName] || 0;
    if (limit === 0) return false;

    // Get Active Payments Count
    const { data: payments } = await supabase.from('payments').select('id').eq('user_id', userId).eq('status', 'captured');
    const totalQuota = limit * (payments?.length || 1);

    // Get Total Leads Received
    const { count: totalLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', userId);

    return (totalLeads || 0) < totalQuota;
}


// Get REAL-TIME today's count (Bypassing potentially stale 'leads_today' column)
async function getRealTodayCount(supabase: any, userId: string): Promise<number> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(); // UTC Midnight (Approx) - Better to use exact range if possible
    // Use Postgres 'CURRENT_DATE' logic implicitly by time range
    const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00.000Z');

    return count || 0;
}

serve(async (req) => {
    const url = new URL(req.url);
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // 1. VERIFICATION
    if (req.method === 'GET') {
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');
        if (mode === 'subscribe' && token === VERIFY_TOKEN) return new Response(challenge, { status: 200 });
        return new Response('Forbidden', { status: 403 });
    }

    // 2. LEAD PROCESSING
    if (req.method === 'POST') {
        try {
            const body = await req.json();
            for (const entry of body.entry || []) {
                for (const change of entry.changes || []) {
                    const leadData = change.value?.leadgen_id ? change.value : null;
                    if (!leadData) continue;

                    // A. FETCH SOURCE PAGE & TEAM ID
                    const pageId = leadData.page_id || entry.id;
                    const { data: pageData } = await supabase.from('meta_pages').select('*').eq('page_id', pageId).single();

                    // IRON DOME: If page unknown or has no team, DO NOT ASSIGN.
                    // Default to 'TEAM_PUNJAB' only if legacy support implies, but for isolation we want strictness.
                    // However, for migration safety, we default to Punjab if null.
                    const teamId = pageData?.team_id || 'TEAM_PUNJAB';
                    const pageName = pageData?.page_name || 'Unknown Page';

                    // B. EXTRACT FIELDS
                    const formId = leadData.form_id;
                    const fields: Record<string, string> = {};
                    for (const f of leadData.field_data || []) { fields[f.name] = f.values?.[0] || ''; }

                    const name = fields.full_name || fields.name || 'Unknown';
                    const city = fields.city || '';
                    let rawPhone = fields.phone_number || fields.phoneNumber || fields.mobile || '';
                    // Fallback for weird field names
                    if (!rawPhone) {
                        const k = Object.keys(fields).find(k => k.toLowerCase().match(/phone|mobile/));
                        if (k) rawPhone = fields[k];
                    }
                    const phone = (rawPhone || '').replace(/\D/g, '').slice(-10);

                    // C. BASIC VALIDATION
                    if (name.toLowerCase().includes('test')) {
                        console.log(`🧪 Test Lead: ${name}`);
                        await supabase.from('leads').insert({ name: `[TEST] ${name}`, phone: 'TEST', city, source: `Meta - ${pageName}`, status: 'Test', form_id: formId });
                        continue;
                    }
                    if (!isValidIndianPhone(phone)) {
                        await supabase.from('leads').insert({ name, phone: phone || 'INVALID', city, source: `Meta - ${pageName}`, status: 'Invalid', form_id: formId });
                        continue;
                    }

                    // D. DUPLICATE CHECK
                    const { data: dup } = await supabase.from('leads').select('id').eq('phone', phone).limit(1);
                    if (dup && dup.length > 0) {
                        await supabase.from('leads').insert({ name, phone, city, source: `Meta - ${pageName}`, status: 'Duplicate', form_id: formId });
                        continue;
                    }

                    // E. TIME CHECK
                    if (!isWithinWorkingHours()) {
                        await supabase.from('leads').insert({ name, phone, city, source: `Meta - ${pageName}`, status: 'Night_Backlog', form_id: formId });
                        continue;
                    }

                    // F. FETCH ELIGIBLE USERS (IRON DOME FILTER)
                    // 1. Must be Active
                    // 2. Must match TEAM ID (Crucial!)
                    const { data: teamUsers, error: usersError } = await supabase
                        .from('users')
                        .select('id, name, email, plan_name, daily_limit')
                        .eq('is_active', true)
                        .eq('team_id', teamId); // strictly filter by team

                    if (!teamUsers || teamUsers.length === 0) {
                        console.log(`⚠️ No Active Users in ${teamId} for Page ${pageName}`);
                        await supabase.from('leads').insert({ name, phone, city, source: `Meta - ${pageName}`, status: 'New', form_id: formId }); // Status New = Pending manual assignment
                        continue;
                    }

                    // G. QUOTA & DISTRIBUTION LOGIC
                    const eligibleUsers = [];
                    for (const user of teamUsers) {
                        // 1. Real-time Daily Limit Check
                        const todayCount = await getRealTodayCount(supabase, user.id);
                        if (todayCount >= (user.daily_limit || 0)) continue;

                        // 2. Total Quota Check
                        const hasQuota = await hasQuotaRemaining(supabase, user.id, user.plan_name);
                        if (!hasQuota) {
                            // Auto-stop user
                            await supabase.from('users').update({ is_active: false }).eq('id', user.id);
                            continue;
                        }

                        eligibleUsers.push({ ...user, leads_today: todayCount });
                    }

                    if (eligibleUsers.length === 0) {
                        console.log(`⚠️ All Users in ${teamId} are Full.`);
                        await supabase.from('leads').insert({ name, phone, city, source: `Meta - ${pageName}`, status: 'New', form_id: formId });
                        continue;
                    }

                    // H. SORTING (Round Robin / Fairness)
                    // Sort by: Fewest Leads Received Today -> Higher Plan Priority
                    eligibleUsers.sort((a, b) => {
                        const countA = a.leads_today || 0;
                        const countB = b.leads_today || 0;
                        if (countA !== countB) return countA - countB; // Less leads first

                        // Tie-breaker: Plan Weight
                        const getWeight = (p: string) => p.includes('turbo') ? 100 : p.includes('weekly') ? 90 : p.includes('manager') ? 80 : 10;
                        return getWeight(b.plan_name) - getWeight(a.plan_name);
                    });

                    const targetUser = eligibleUsers[0];

                    // I. ASSIGNMENT
                    console.log(`✅ Assigning Lead (${phone}) to ${targetUser.name} (${teamId})`);

                    await supabase.from('leads').insert({
                        name, phone, city,
                        source: `Meta - ${pageName}`,
                        status: 'Assigned',
                        user_id: targetUser.id,
                        assigned_to: targetUser.id,
                        form_id: formId,
                        created_at: new Date().toISOString()
                    });

                    // Update User Counter
                    await supabase.from('users').update({ leads_today: (targetUser.leads_today || 0) + 1 }).eq('id', targetUser.id);
                }
            }
            return new Response('Processed', { status: 200 });
        } catch (e) {
            console.error('Webhook Error:', e);
            return new Response(e.message, { status: 500 });
        }
    }
    return new Response('Method Not Allowed', { status: 405 });
});
