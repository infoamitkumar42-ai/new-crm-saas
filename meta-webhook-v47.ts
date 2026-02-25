import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * 🚀 LEADFLOW WEBHOOK v47 - BATCH SEQUENTIAL DISTRIBUTION
 * 
 * CHANGES:
 * 1. ✅ 24/7 MODE: Removed night lock.
 * 2. ✅ BATCHING: Sequential 15-lead blocks per user.
 * 3. ✅ PRIORITY: Tier-based (Turbo first) + Batch completion.
 */

const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || 'LeadFlow_Meta_2026_Premium';
const BATCH_SIZE = 15;

function isWithinWorkingHours(): boolean {
    // 🔓 v47: Always active for 24/7 distribution
    return true;
}

function isValidIndianPhone(phone: string): boolean {
    return /^[6789]\d{9}$/.test(phone);
}

function extractField(fields: Record<string, string>, ...keys: string[]): string {
    for (const key of keys) {
        if (fields[key] && fields[key].trim()) return fields[key].trim();
    }
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

serve(async (req) => {
    const url = new URL(req.url);
    const supabase = createClient(Deno.env.get('SUPABASE__URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    if (req.method === 'GET') {
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');
        if (mode === 'subscribe' && token === VERIFY_TOKEN) return new Response(challenge, { status: 200 });
        return new Response('Forbidden', { status: 403 });
    }

    if (req.method === 'POST') {
        const body = await req.json();
        for (const entry of body.entry || []) {
            for (const change of entry.changes || []) {
                const leadData = change.value?.leadgen_id ? change.value : null;
                if (!leadData) continue;

                const leadId = leadData.leadgen_id;
                const pageId = leadData.page_id || entry.id;

                const { data: pageData } = await supabase.from('meta_pages').select('*').eq('page_id', pageId).single();
                if (!pageData) continue;

                const requiredTeamCode = pageData.team_id;
                const pageName = pageData.page_name || 'Unknown Page';
                const accessToken = pageData.access_token;

                let fields: Record<string, string> = {};
                if (leadData.field_data) {
                    for (const f of leadData.field_data) fields[f.name] = f.values?.[0] || '';
                } else if (accessToken) {
                    const graphRes = await fetch(`https://graph.facebook.com/v18.0/${leadId}?fields=field_data&access_token=${accessToken}`);
                    const graphJson = await graphRes.json();
                    for (const f of graphJson.field_data || []) fields[f.name] = f.values?.[0] || '';
                }

                const name = extractField(fields, 'full_name', 'name', 'first_name') || 'Unknown Lead';
                const city = extractField(fields, 'city', 'location', 'town', 'address') || 'Unknown';
                const phone = sanitizePhone(extractField(fields, 'phone_number', 'phoneNumber', 'phone', 'mobile', 'contact'));

                if (name.toLowerCase().includes('test')) continue;
                if (!isValidIndianPhone(phone)) {
                    await supabase.from('leads').insert({ name, phone: phone || 'INVALID', city, source: `Meta - ${pageName}`, status: 'Invalid' });
                    continue;
                }

                const { data: dup } = await supabase.from('leads').select('id').eq('phone', phone).limit(1);
                if (dup && dup.length > 0) {
                    await supabase.from('leads').insert({ name, phone, city, source: `Meta - ${pageName}`, status: 'Duplicate' });
                    continue;
                }

                // 🚀 v47 BATCH SORTING LOGIC
                const teamCodes = requiredTeamCode.split(',').map((c: string) => c.trim());
                const { data: users } = await supabase
                    .from('users')
                    .select('id, name, email, plan_name, daily_limit, daily_limit_override, leads_today, total_leads_received, total_leads_promised')
                    .in('team_code', teamCodes)
                    .eq('is_active', true)
                    .eq('is_online', true)
                    .in('role', ['member', 'manager']);

                if (!users || users.length === 0) {
                    await supabase.from('leads').insert({ name, phone, city, source: `Meta - ${pageName}`, status: 'Queued', notes: 'No users online' });
                    continue;
                }

                const tierMap = { 'turbo': 5, 'boost': 4, 'manager': 3, 'supervisor': 2, 'starter': 1, 'none': 0 };
                const eligible = users.filter(u => {
                    const limit = u.daily_limit_override || u.daily_limit || 100;
                    const quotaFull = (u.total_leads_promised > 0 && u.total_leads_received >= u.total_leads_promised);
                    return u.leads_today < limit && !quotaFull;
                });

                if (eligible.length === 0) {
                    await supabase.from('leads').insert({ name, phone, city, source: `Meta - ${pageName}`, status: 'Queued', notes: 'All users at capacity' });
                    continue;
                }

                eligible.sort((a, b) => {
                    const aTier = tierMap[a.plan_name?.toLowerCase()] || 0;
                    const bTier = tierMap[b.plan_name?.toLowerCase()] || 0;
                    if (aTier !== bTier) return bTier - aTier;

                    const aIsMid = (a.leads_today % BATCH_SIZE !== 0 && a.leads_today > 0);
                    const bIsMid = (b.leads_today % BATCH_SIZE !== 0 && b.leads_today > 0);
                    if (aIsMid && !bIsMid) return -1;
                    if (!aIsMid && bIsMid) return 1;

                    const aBatches = Math.floor(a.leads_today / BATCH_SIZE);
                    const bBatches = Math.floor(b.leads_today / BATCH_SIZE);
                    if (aBatches !== bBatches) return aBatches - bBatches;
                    return a.email.localeCompare(b.email);
                });

                const target = eligible[0];
                const finalUserId = target.id;

                await supabase.from('leads').insert({
                    name, phone, city, source: `Meta - ${pageName}`, status: 'Assigned',
                    assigned_to: finalUserId, user_id: finalUserId, assigned_at: new Date().toISOString()
                });

                await supabase.rpc('exec_sql', { sql_query: `UPDATE users SET leads_today = leads_today + 1, total_leads_received = total_leads_received + 1 WHERE id = '${finalUserId}'` }).catch(() => { });
            }
        }
        return new Response('OK', { status: 200 });
    }
    return new Response('Method Not Allowed', { status: 405 });
});
