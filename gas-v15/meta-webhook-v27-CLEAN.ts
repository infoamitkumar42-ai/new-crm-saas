
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * LEADFLOW WEBHOOK v27 (CLEAN) - NO STATE LOGIC
 * =============================================
 * CORE FEATURES:
 * 1. Fair Batch Distribution (2-Lead Batches).
 * 2. Hard Daily Limit Check.
 * 3. Priority: Lowest Leads First -> Hierarchy Tie-Breaker.
 */

const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || 'LeadFlow_Meta_2026_Premium';

// Working Hours (IST)
const WORKING_HOURS = {
    START: 8,   // 8 AM
    END: 22,    // 10 PM
    TIMEZONE: 'Asia/Kolkata'
};

function isWithinWorkingHours(): boolean {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", { timeZone: WORKING_HOURS.TIMEZONE }));
    const hour = istTime.getHours();
    return hour >= WORKING_HOURS.START && hour < WORKING_HOURS.END;
}

function isValidIndianPhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '').slice(-10);
    return cleaned.length === 10 && !cleaned.startsWith('0000') && /^[6-9]\d{9}$/.test(cleaned);
}

serve(async (req) => {
    const { method } = req;
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (method === 'GET') {
        const url = new URL(req.url);
        if (url.searchParams.get('hub.mode') === 'subscribe' &&
            url.searchParams.get('hub.verify_token') === VERIFY_TOKEN) {
            return new Response(url.searchParams.get('hub.challenge'), { status: 200 });
        }
        return new Response('Forbidden', { status: 403 });
    }

    if (method === 'POST') {
        try {
            const payload = await req.json();

            for (const entry of payload.entry || []) {
                const pageId = entry.id;
                for (const change of entry.changes) {
                    if (change.field !== 'leadgen') continue;

                    const leadgenId = change.value.leadgen_id;
                    const { data: pageData } = await supabase.from('connected_pages').select('*').eq('page_id', pageId).single();
                    if (!pageData) continue;

                    const metaRes = await fetch(`https://graph.facebook.com/v18.0/${leadgenId}?access_token=${pageData.access_token}`);
                    const leadData = await metaRes.json();

                    const fields: Record<string, string> = {};
                    leadData.field_data?.forEach((f: any) => fields[f.name] = f.values?.[0] || '');

                    const name = fields.full_name || 'Enquiry';
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

                    // 2. GET ACTIVE USERS
                    const { data: allUsers } = await supabase.from('users').select('*').eq('is_active', true);
                    if (!allUsers || allUsers.length === 0) {
                        await supabase.from('leads').insert({ name, phone, city, source: `Meta - ${pageData.page_name}`, status: 'New' });
                        continue;
                    }

                    // 3. FILTER
                    const eligibleUsers = allUsers.filter(user => {
                        // Hard Limit Check
                        if ((user.leads_today || 0) >= (user.daily_limit || 0)) return false;

                        // Team Filter
                        if (pageData.manager_id && user.manager_id !== pageData.manager_id && user.id !== pageData.manager_id) return false;

                        return true;
                    });

                    if (eligibleUsers.length === 0) {
                        console.log('⚠️ No eligible users (All Limits Reached)');
                        await supabase.from('leads').insert({ name, phone, city, source: `Meta - ${pageData.page_name}`, status: 'New' });
                        continue;
                    }

                    // 4. SORTING (FAIR BATCH LOGIC)
                    const getPlanWeight = (plan: string) => {
                        const p = (plan || '').toLowerCase();
                        if (p.includes('turbo')) return 100;
                        if (p.includes('manager')) return 90;
                        if (p.includes('supervisor')) return 80;
                        return 0;
                    };

                    eligibleUsers.sort((a, b) => {
                        const leadsA = a.leads_today || 0;
                        const leadsB = b.leads_today || 0;

                        // Priority 1: Odd Batches (Finish them)
                        const aOdd = leadsA % 2 !== 0;
                        const bOdd = leadsB % 2 !== 0;
                        if (aOdd && !bOdd) return -1;
                        if (!aOdd && bOdd) return 1;

                        // Priority 2: LOWEST TOTAL FIRST (Round Balancing)
                        // If A=2 and B=0 -> B goes first.
                        if (leadsA !== leadsB) return leadsA - leadsB;

                        // Priority 3: Hierarchy (Tie Only)
                        const wA = getPlanWeight(a.plan_name);
                        const wB = getPlanWeight(b.plan_name);
                        if (wA !== wB) return wB - wA;

                        return (a.id || '').localeCompare(b.id || '');
                    });

                    const selectedUser = eligibleUsers[0];
                    const newCount = (selectedUser.leads_today || 0) + 1;
                    console.log(`✅ Assigning ${phone.slice(-4)} -> ${selectedUser.name} (#${newCount})`);

                    // 5. ASSIGN
                    await supabase.from('leads').insert({
                        name, phone, city,
                        source: `Meta - ${pageData.page_name}`,
                        status: 'Assigned',
                        user_id: selectedUser.id,
                        assigned_to: selectedUser.id,
                        assigned_at: new Date().toISOString(),
                        is_valid_phone: true
                    });

                    // 6. DB UPDATE
                    await supabase.from('users').update({
                        leads_today: newCount,
                        updated_at: new Date().toISOString()
                    }).eq('id', selectedUser.id);

                    return new Response("Success", { status: 200 });
                }
            }
            return new Response('Processed', { status: 200 });
        } catch (e) {
            return new Response(e.message, { status: 500 });
        }
    }
    return new Response('Method Not Allowed', { status: 405 });
});
