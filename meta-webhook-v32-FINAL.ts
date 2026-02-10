
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * LEADFLOW WEBHOOK v32 - IRON DOME & QUOTA FIX
 * 
 * FEATURES:
 * 1. IRON DOME: Form ID based routing (Specialists first).
 * 2. MANAGER QUOTA FIX: Increased limit for Managers/Turbo users (108 -> 500).
 * 3. ATOMIC UPDATES: RPC for incrementing leads_today.
 * 4. STRICT ISOLATION: Team-based distribution.
 */

const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || 'LeadFlow_Meta_2026_Premium';

// Increased limits to prevent skipping high-volume users/managers
const PLAN_LIMITS: { [key: string]: number } = {
    'starter': 55, 'supervisor': 115, 'manager': 500, 'weekly_boost': 150, 'turbo_boost': 500
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

async function getRealTodayCount(supabase: any, userId: string): Promise<number> {
    const startOfDay = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
    const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', userId)
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

                    const pageId = leadData.page_id || entry.id;
                    const { data: pageData } = await supabase.from('meta_pages').select('*').eq('page_id', pageId).single();
                    const requiredTeamCode = pageData?.team_id;
                    const pageName = pageData?.page_name || 'Unknown Page';

                    // Extract Fields
                    const formId = leadData.form_id || '';
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
                        await supabase.from('leads').insert({ name, phone, city, source: `Meta - ${pageName}`, status: 'New', form_id: formId, notes: 'No Team Mapped' });
                        continue;
                    }

                    // 1. FETCH TEAM MEMBERS
                    const { data: teamUsers, error: teamErr } = await supabase.from('users')
                        .select('id, name, email, plan_name, daily_limit, team_code, preferred_form_ids, accept_all_forms')
                        .eq('team_code', requiredTeamCode)
                        .eq('is_active', true)
                        .eq('is_online', true);

                    if (teamErr || !teamUsers || teamUsers.length === 0) {
                        await supabase.from('leads').insert({ name, phone, city, source: `Meta - ${pageName}`, status: 'New', form_id: formId });
                        continue;
                    }

                    // 2. IRON DOME - Specialist Filtering
                    let candidates = teamUsers;
                    if (formId) {
                        const specialists = teamUsers.filter(u =>
                            u.accept_all_forms === false &&
                            u.preferred_form_ids &&
                            u.preferred_form_ids.includes(formId)
                        );
                        if (specialists.length > 0) {
                            console.log(`🎯 Iron Dome: Restricting to ${specialists.length} specialists for form ${formId}`);
                            candidates = specialists;
                        } else {
                            // No specialists for this form? Use general pool (those who accept all)
                            candidates = teamUsers.filter(u => u.accept_all_forms !== false);
                        }
                    }

                    // 3. ELIGIBILITY & QUOTA
                    const eligibleUsers = [];
                    for (const user of candidates) {
                        const todayCount = await getRealTodayCount(supabase, user.id);
                        if (todayCount >= (user.daily_limit || 0)) continue;

                        // PLAN QUOTA CHECK (Relaxed for Managers)
                        const planLimit = PLAN_LIMITS[user.plan_name] || 50;
                        const { data: payments } = await supabase.from('payments').select('id').eq('user_id', user.id).eq('status', 'captured');
                        const totalQuota = planLimit * (payments?.length || 1);

                        const { count: totalLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('assigned_to', user.id);
                        if ((totalLeads || 0) >= totalQuota) {
                            if (!user.plan_name.includes('turbo') && user.plan_name !== 'manager') continue;
                            // Managers get a pass or very high limit (handled by PLAN_LIMITS already)
                        }

                        eligibleUsers.push({ ...user, leads_today: todayCount });
                    }

                    if (eligibleUsers.length === 0) {
                        await supabase.from('leads').insert({ name, phone, city, source: `Meta - ${pageName}`, status: 'New', form_id: formId });
                        continue;
                    }

                    // 4. SORT: Least Leads First
                    eligibleUsers.sort((a, b) => {
                        const diff = (a.leads_today || 0) - (b.leads_today || 0);
                        if (diff !== 0) return diff;
                        return (b.daily_limit || 0) - (a.daily_limit || 0);
                    });

                    const targetUser = eligibleUsers[0];
                    console.log(`✅ Assigning ${phone} -> ${targetUser.name}`);

                    // 5. INSERT & UPDATE
                    await supabase.from('leads').insert({
                        name, phone, city, source: `Meta - ${pageName}`, status: 'Assigned',
                        user_id: targetUser.id, assigned_to: targetUser.id, form_id: formId,
                        created_at: new Date().toISOString(), assigned_at: new Date().toISOString()
                    });

                    await supabase.rpc('increment_leads_today', { user_id: targetUser.id });
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
