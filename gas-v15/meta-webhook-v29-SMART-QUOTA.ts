import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * LEADFLOW WEBHOOK v29 - SMART QUOTA SYSTEM
 * 
 * KEY RULE: Plan stops ONLY when total leads quota is complete
 * - Date expiry is IGNORED - leads matter, not date
 * - Renewal adds more quota (limit x payments)
 * - Replacement leads are counted
 * 
 * PLAN LIMITS (per payment):
 * - starter: 55 leads
 * - supervisor: 115 leads
 * - manager: 176 leads
 * - weekly_boost: 92 leads
 * - turbo_boost: 108 leads
 */

const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || 'LeadFlow_Meta_2026_Premium';

// Plan limits per payment
const PLAN_LIMITS: { [key: string]: number } = {
    'starter': 55,
    'supervisor': 115,
    'manager': 176,
    'weekly_boost': 92,
    'turbo_boost': 108
};

// Working Hours (IST)
const WORKING_HOURS = {
    START: 8,   // 8 AM
    END: 22,    // 10 PM
    TIMEZONE: 'Asia/Kolkata'
};

function isWithinWorkingHours(): boolean {
    const now = new Date();
    const hour = parseInt(new Intl.DateTimeFormat('en-US', { hour: '2-digit', hour12: false, timeZone: WORKING_HOURS.TIMEZONE }).format(now));
    return hour >= WORKING_HOURS.START && hour < WORKING_HOURS.END;
}

function isValidIndianPhone(phone: string): boolean {
    return /^[6789]\d{9}$/.test(phone);
}

// Calculate total quota based on plan and payments
async function getTotalQuota(supabase: any, userId: string, planName: string): Promise<number> {
    const baseLimit = PLAN_LIMITS[planName] || 0;
    if (baseLimit === 0) return 0;

    const { data: payments } = await supabase
        .from('payments')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'captured');

    const paymentCount = payments?.length || 1;
    return baseLimit * paymentCount;
}

// Check if user has quota remaining
async function hasQuotaRemaining(supabase: any, userId: string, planName: string): Promise<boolean> {
    const totalQuota = await getTotalQuota(supabase, userId, planName);
    if (totalQuota === 0) return false;

    const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    return (totalLeads || 0) < totalQuota;
}

// Auto-stop user if quota complete
async function checkAndAutoStop(supabase: any, userId: string, planName: string): Promise<void> {
    const hasQuota = await hasQuotaRemaining(supabase, userId, planName);

    if (!hasQuota) {
        console.log(`🛑 Auto-stopping user (quota complete)`);
        await supabase.from('users').update({
            is_active: false,
            daily_limit: 0,
            payment_status: 'inactive'
        }).eq('id', userId);
    }
}

// Get real-time today's lead count (not from stored counter)
async function getRealTodayCount(supabase: any, userId: string): Promise<number> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', todayStart)
        .lt('created_at', tomorrowStart);

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

                    const pageId = leadData.page_id || entry.id;
                    const { data: pageData } = await supabase.from('meta_pages').select('*').eq('page_id', pageId).single();
                    if (!pageData) continue;

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

                    // 1. VALIDATION
                    if (name.toLowerCase().includes('test')) {
                        await supabase.from('leads').insert({ name: `[TEST] ${name}`, phone: 'TEST', city, source: `Meta - ${pageData.page_name}`, status: 'Test' });
                        continue;
                    }
                    if (!isValidIndianPhone(phone)) {
                        await supabase.from('leads').insert({ name, phone: phone || 'INVALID', city, source: `Meta - ${pageData.page_name}`, status: 'Invalid' });
                        continue;
                    }
                    const { data: dup } = await supabase.from('leads').select('id').eq('phone', phone).limit(1);
                    if (dup && dup.length > 0) {
                        await supabase.from('leads').insert({ name, phone, city, source: `Meta - ${pageData.page_name}`, status: 'Duplicate' });
                        continue;
                    }
                    if (!isWithinWorkingHours()) {
                        await supabase.from('leads').insert({ name, phone, city, source: `Meta - ${pageData.page_name}`, status: 'Night_Backlog' });
                        continue;
                    }

                    // 2. GET ACTIVE USERS WITH QUOTA CHECK
                    const { data: allUsers } = await supabase.from('users').select('*').eq('is_active', true);
                    if (!allUsers || allUsers.length === 0) {
                        await supabase.from('leads').insert({ name, phone, city, source: `Meta - ${pageData.page_name}`, status: 'New' });
                        continue;
                    }

                    // 3. SMART FILTER - Check daily limit AND total quota using REAL counts
                    const eligibleUsers = [];
                    for (const user of allUsers) {
                        // Get REAL today count (not stored counter which may be stale)
                        const realTodayCount = await getRealTodayCount(supabase, user.id);

                        // Check daily limit using real count
                        if (realTodayCount >= (user.daily_limit || 0)) continue;

                        // SMART: Check if total quota is remaining
                        const hasQuota = await hasQuotaRemaining(supabase, user.id, user.plan_name);
                        if (!hasQuota) {
                            // Auto-stop user with completed quota
                            await checkAndAutoStop(supabase, user.id, user.plan_name);
                            continue;
                        }

                        // Store real count for sorting
                        eligibleUsers.push({ ...user, real_leads_today: realTodayCount });
                    }

                    if (eligibleUsers.length === 0) {
                        console.log('⚠️ No eligible users (All Limits/Quotas Reached)');
                        await supabase.from('leads').insert({ name, phone, city, source: `Meta - ${pageData.page_name}`, status: 'New' });
                        continue;
                    }

                    // 4. SORTING (FAIR BATCH LOGIC)
                    const getPlanWeight = (plan: string) => {
                        const p = (plan || '').toLowerCase();
                        if (p.includes('turbo')) return 100;
                        if (p.includes('weekly')) return 95;
                        if (p.includes('manager')) return 90;
                        if (p.includes('supervisor')) return 80;
                        if (p.includes('starter')) return 10;
                        return 0;
                    };
                    eligibleUsers.sort((a, b) => {
                        // Use REAL counts (not stored which may be stale)
                        const leadsA = a.real_leads_today || 0;
                        const leadsB = b.real_leads_today || 0;

                        // Priority 1: Who has FEWEST leads? (Strict Equal Rotation)
                        const diff = leadsA - leadsB;
                        if (diff !== 0) return diff;

                        // Priority 2: If leads equal, then Higher Plan First
                        const weightDiff = getPlanWeight(b.plan_name) - getPlanWeight(a.plan_name);
                        if (weightDiff !== 0) return weightDiff;

                        return 0;
                    });
                    const selectedUser = eligibleUsers[0];
                    const newCount = (selectedUser.real_leads_today || 0) + 1;
                    console.log(`✅ Assigning ${phone.slice(-4)} -> ${selectedUser.name} (#${newCount})`);

                    // 5. ASSIGN
                    await supabase.from('leads').insert({
                        name, phone, city,
                        source: `Meta - ${pageData.page_name}`,
                        status: 'Assigned',
                        user_id: selectedUser.id,
                        assigned_to: selectedUser.id,
                        form_id: formId,
                        created_at: new Date().toISOString()
                    });

                    // 6. UPDATE COUNTER & CHECK QUOTA
                    await supabase.from('users').update({ leads_today: newCount }).eq('id', selectedUser.id);

                    // Auto-stop if quota complete after this lead
                    await checkAndAutoStop(supabase, selectedUser.id, selectedUser.plan_name);
                }
            }
            return new Response('Processed', { status: 200 });
        } catch (e) {
            return new Response(e.message, { status: 500 });
        }
    }
    return new Response('Method Not Allowed', { status: 405 });
});
