
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * LEADFLOW WEBHOOK v27 - FINAL CORRECTED (FAIR BATCH ROTATION)
 * ============================================================
 * FIXES:
 * 1. Priority: BATCH COMPLETION > TOTAL LEADS > HIERARCHY.
 *    (Ensures everyone completes Round 1 (2 leads) before anyone starts Round 2).
 * 2. Daily Limit: Hard Stop if leads_today >= daily_limit.
 * 3. Sync: Direct DB Update (No RPC) to prevent "Infinite Loop".
 */

const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || 'LeadFlow_Meta_2026_Premium';

// Working Hours (IST)
const WORKING_HOURS = {
    START: 8,   // 8 AM
    END: 22,    // 10 PM
    TIMEZONE: 'Asia/Kolkata'
};

// ============================================================================
// 🗺️ CITY TO STATE MAPPING
// ============================================================================
const CITY_STATE_MAP: Record<string, string> = {
    // PUNJAB
    'ludhiana': 'punjab', 'amritsar': 'punjab', 'jalandhar': 'punjab', 'patiala': 'punjab',
    'bathinda': 'punjab', 'mohali': 'punjab', 'pathankot': 'punjab', 'moga': 'punjab',
    'batala': 'punjab', 'abohar': 'punjab', 'malerkotla': 'punjab', 'khanna': 'punjab',
    'phagwara': 'punjab', 'muktsar': 'punjab', 'barnala': 'punjab', 'rajpura': 'punjab',
    'firozpur': 'punjab', 'ferozepur': 'punjab', 'kapurthala': 'punjab', 'hoshiarpur': 'punjab',
    'faridkot': 'punjab', 'sangrur': 'punjab', 'kotkapura': 'punjab', 'sunam': 'punjab',
    'gurdaspur': 'punjab', 'zirakpur': 'punjab', 'dera bassi': 'punjab', 'kharar': 'punjab',
    'nangal': 'punjab', 'rupnagar': 'punjab', 'ropar': 'punjab', 'nawanshahr': 'punjab',
    'sbs nagar': 'punjab', 'anandpur sahib': 'punjab', 'fatehgarh sahib': 'punjab',
    'sirhind': 'punjab', 'mansa': 'punjab', 'budhlada': 'punjab', 'rampura phul': 'punjab',
    'dhuri': 'punjab', 'moonak': 'punjab', 'lehra': 'punjab', 'nabha': 'punjab',
    'samana': 'punjab', 'patran': 'punjab', 'ghanaur': 'punjab', 'banur': 'punjab',
    'qadian': 'punjab', 'mukerian': 'punjab', 'dasuya': 'punjab', 'garhshankar': 'punjab',
    'balachaur': 'punjab', 'nakodar': 'punjab', 'phillaur': 'punjab', 'goraya': 'punjab',
    'kartarpur': 'punjab', 'adampur': 'punjab', 'bhogpur': 'punjab', 'sultanpur lodhi': 'punjab',
    'makhu': 'punjab', 'zira': 'punjab', 'jalalabad': 'punjab', 'fazilka': 'punjab',
    'malout': 'punjab', 'gidderbaha': 'punjab', 'raikot': 'punjab', 'jagraon': 'punjab',
    'mullanpur': 'punjab', 'samrala': 'punjab', 'machhiwara': 'punjab', 'sahnewal': 'punjab',
    'doraha': 'punjab', 'payal': 'punjab', 'ahmedgarh': 'punjab', 'tarn taran': 'punjab',
    'patti': 'punjab', 'goindwal': 'punjab', 'ajnala': 'punjab', 'majitha': 'punjab',
    'beas': 'punjab', 'talwara': 'punjab', 'dinanagar': 'punjab', 'maur': 'punjab',
    'jaitu': 'punjab', 'bareta': 'punjab', 'goniana': 'punjab', 'raman': 'punjab',
    'kurali': 'punjab', 'landran': 'punjab', 'nayagaon': 'punjab', 'bhatinda': 'punjab',
    'sas nagar': 'punjab', 'sahibzada ajit singh nagar': 'punjab',
    'amloh': 'punjab', 'maheshpura': 'punjab', 'amrirsar': 'punjab', 'amitser': 'punjab',
    // CHANDIGARH
    'chandigarh': 'chandigarh', 'chd': 'chandigarh', 'manimajra': 'chandigarh',
    'sector 17': 'chandigarh', 'sector 22': 'chandigarh', 'sector 35': 'chandigarh',
    // HARYANA
    'panchkula': 'haryana', 'pinjore': 'haryana', 'kalka': 'haryana', 'ambala': 'haryana',
    'kurukshetra': 'haryana', 'karnal': 'haryana', 'panipat': 'haryana', 'yamunanagar': 'haryana',
    'gurugram': 'haryana', 'gurgaon': 'haryana', 'gurgram': 'haryana', 'faridabad': 'haryana', 'rohtak': 'haryana',
    'hisar': 'haryana', 'sirsa': 'haryana', 'sonipat': 'haryana', 'jhajjar': 'haryana',
    'rewari': 'haryana', 'mahendragarh': 'haryana', 'bhiwani': 'haryana', 'jind': 'haryana',
    'kaithal': 'haryana', 'fatehabad': 'haryana', 'palwal': 'haryana', 'nuh': 'haryana',
    'manesar': 'haryana', 'bahadurgarh': 'haryana', 'narnaul': 'haryana', 'hansi': 'haryana',
    'tohana': 'haryana', 'dabwali': 'haryana', 'dhakoli': 'haryana', 'baltana': 'haryana',
    'peer muchalla': 'haryana', 'thanesar': 'haryana', 'jagadhri': 'haryana',
    // DELHI NCR
    'delhi': 'delhi', 'new delhi': 'delhi', 'ncr': 'delhi', 'south delhi': 'delhi',
    'north delhi': 'delhi', 'east delhi': 'delhi', 'west delhi': 'delhi',
    'noida': 'delhi', 'greater noida': 'delhi', 'ghaziabad': 'delhi',
    'connaught place': 'delhi', 'karol bagh': 'delhi', 'chandni chowk': 'delhi',
    'saket': 'delhi', 'malviya nagar': 'delhi', 'hauz khas': 'delhi', 'lajpat nagar': 'delhi',
    'defence colony': 'delhi', 'greater kailash': 'delhi', 'nehru place': 'delhi',
    'okhla': 'delhi', 'vasant kunj': 'delhi', 'dwarka': 'delhi', 'rohini': 'delhi',
    'pitampura': 'delhi', 'janakpuri': 'delhi', 'rajouri garden': 'delhi',
    'laxmi nagar': 'delhi', 'preet vihar': 'delhi', 'shahdara': 'delhi',
    'anand vihar': 'delhi', 'kaushambi': 'delhi', 'vaishali': 'delhi', 'indirapuram': 'delhi',
    // Add other major cities if necessary
};

const STATE_ALIASES: Record<string, string> = {
    'pb': 'punjab', 'panjab': 'punjab',
    'hr': 'haryana', 'hariana': 'haryana',
    'hp': 'himachal pradesh', 'himachal': 'himachal pradesh',
    'uk': 'uttarakhand', 'uttaranchal': 'uttarakhand',
    'dl': 'delhi', 'ncr': 'delhi', 'new delhi': 'delhi',
    'chd': 'chandigarh',
    'mh': 'maharashtra',
    'rj': 'rajasthan',
    'jk': 'jammu kashmir', 'j&k': 'jammu kashmir',
    'up': 'uttar pradesh',
    'mp': 'madhya pradesh',
    'ka': 'karnataka',
    'tn': 'tamil nadu',
    'wb': 'west bengal',
    'ts': 'telangana',
    'gj': 'gujarat',
    'all india': 'all india', 'india': 'all india', 'pan india': 'all india'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isWithinWorkingHours(): boolean {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", { timeZone: WORKING_HOURS.TIMEZONE }));
    const hour = istTime.getHours();
    const isWorking = hour >= WORKING_HOURS.START && hour < WORKING_HOURS.END;
    console.log(`⏰ IST: ${istTime.toLocaleTimeString()} | Working: ${isWorking ? 'YES' : 'NO'}`);
    return isWorking;
}

function detectStateFromCity(city: string): string {
    const cityNorm = city.toLowerCase().trim();
    if (CITY_STATE_MAP[cityNorm]) return CITY_STATE_MAP[cityNorm];
    for (const [cityKey, state] of Object.entries(CITY_STATE_MAP)) {
        if (cityNorm.includes(cityKey) || cityKey.includes(cityNorm)) return state;
    }
    return 'unknown';
}

function normalizeState(state: string): string {
    const stateNorm = state.toLowerCase().trim();
    return STATE_ALIASES[stateNorm] || stateNorm;
}

function isValidIndianPhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '').slice(-10);
    return cleaned.length === 10 && !cleaned.startsWith('0000') && /^[6-9]\d{9}$/.test(cleaned);
}

// ============================================================================
// MAIN WEBHOOK HANDLER
// ============================================================================

serve(async (req) => {
    const { method } = req;
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // ===== GET: Verification =====
    if (method === 'GET') {
        const url = new URL(req.url);
        if (url.searchParams.get('hub.mode') === 'subscribe' &&
            url.searchParams.get('hub.verify_token') === VERIFY_TOKEN) {
            return new Response(url.searchParams.get('hub.challenge'), { status: 200 });
        }
        return new Response('Forbidden', { status: 403 });
    }

    // ===== POST: Processing =====
    if (method === 'POST') {
        try {
            const payload = await req.json();
            console.log('📥 Webhook v27 - FINAL FAIR BATCH');

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
                    const city = (fields.city || 'India').toLowerCase().trim();
                    let rawPhone = fields.phone_number || fields.phoneNumber || fields.mobile || '';
                    if (!rawPhone) {
                        const k = Object.keys(fields).find(k => k.toLowerCase().match(/phone|mobile/));
                        if (k) rawPhone = fields[k];
                    }
                    const phone = (rawPhone || '').replace(/\D/g, '').slice(-10);
                    let state = detectStateFromCity(city);
                    if (state === 'unknown' && fields.state) state = normalizeState(fields.state);

                    console.log(`👤 ${name} | ${phone} | ${state}`);

                    // 1. VALIDATION CHECKS
                    if (name.toLowerCase().includes('test')) {
                        await supabase.from('leads').insert({ name: `[TEST] ${name}`, phone: 'TEST', city, state, source: `Meta - ${pageData.page_name}`, status: 'Test' });
                        continue;
                    }
                    if (!isValidIndianPhone(phone)) {
                        await supabase.from('leads').insert({ name, phone: phone || 'INVALID', city, state, source: `Meta - ${pageData.page_name}`, status: 'Invalid' });
                        continue;
                    }
                    const { data: dup } = await supabase.from('leads').select('id').eq('phone', phone).limit(1);
                    if (dup && dup.length > 0) {
                        await supabase.from('leads').insert({ name, phone, city, state, source: `Meta - ${pageData.page_name}`, status: 'Duplicate' });
                        continue;
                    }
                    if (!isWithinWorkingHours()) {
                        await supabase.from('leads').insert({ name, phone, city, state, source: `Meta - ${pageData.page_name}`, status: 'Night_Backlog' });
                        continue;
                    }

                    // 2. GET ELIGIBLE USERS
                    const { data: allUsers } = await supabase.from('users').select('*').eq('is_active', true);
                    if (!allUsers || allUsers.length === 0) {
                        await supabase.from('leads').insert({ name, phone, city, state, source: `Meta - ${pageData.page_name}`, status: 'New' });
                        continue;
                    }

                    // 3. FILTER (Including Daily Limit Hard Check)
                    const eligibleUsers = allUsers.filter(user => {
                        // A. HARD LIMIT CHECK
                        if ((user.leads_today || 0) >= (user.daily_limit || 0)) return false;

                        // B. Team Filter
                        if (pageData.manager_id && user.manager_id !== pageData.manager_id && user.id !== pageData.manager_id) return false;

                        return true;
                    });

                    if (eligibleUsers.length === 0) {
                        console.log('⚠️ No eligible users (All Limits Reached)');
                        await supabase.from('leads').insert({ name, phone, city, state, source: `Meta - ${pageData.page_name}`, status: 'New' });
                        continue;
                    }

                    // 4. SORTING LOGIC (THE FIX)
                    // Priority 1: Finish Incomplete Batch (Odd Numbers)
                    // Priority 2: LOWEST TOTAL FIRST (Round Balancing) <-- Prevent Monopoly
                    // Priority 3: Hierarchy (Only for Tie Breakdown)

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

                        // 1. Odd Priority (Finish Batch)
                        const aOdd = leadsA % 2 !== 0;
                        const bOdd = leadsB % 2 !== 0;
                        if (aOdd && !bOdd) return -1;
                        if (!aOdd && bOdd) return 1;

                        // 2. TOTAL LEADS (Round Balancing)
                        // If A has 2 and B has 0 -> B goes first.
                        if (leadsA !== leadsB) return leadsA - leadsB;

                        // 3. Hierarchy (Tie Breaker)
                        // If both have 0 -> Turbo goes first.
                        const wA = getPlanWeight(a.plan_name);
                        const wB = getPlanWeight(b.plan_name);
                        if (wA !== wB) return wB - wA;

                        return (a.id || '').localeCompare(b.id || '');
                    });

                    const selectedUser = eligibleUsers[0];
                    const newCount = (selectedUser.leads_today || 0) + 1;
                    console.log(`✅ Assigning to ${selectedUser.name} (Lead #${newCount})`);

                    // 5. ASSIGN & UPDATE (Direct Update)
                    await supabase.from('leads').insert({
                        name, phone, city, state,
                        source: `Meta - ${pageData.page_name}`,
                        status: 'Assigned',
                        user_id: selectedUser.id,
                        assigned_to: selectedUser.id,
                        assigned_at: new Date().toISOString(),
                        is_valid_phone: true
                    });

                    // CRITICAL: Direct SQL Update (No RPC)
                    const { error: upErr } = await supabase
                        .from('users')
                        .update({
                            leads_today: newCount,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', selectedUser.id);

                    if (upErr) console.error('❌ Update Error:', upErr);

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
