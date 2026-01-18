import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * LEADFLOW WEBHOOK v24.0 - COMPLETE OVERHAUL
 * ==========================================
 * 
 * FIXES APPLIED:
 * ✓ All Indian cities (Punjab, Haryana, Delhi, HP, UK, MH, RJ, J&K)
 * ✓ Phone validation: 6/7/8/9 starting digits
 * ✓ Gender default: "any" (both Male/Female)
 * ✓ Duplicate check: 30 days only
 * ✓ Smart Round Robin distribution
 * ✓ Pause/Active status check
 * ✓ assigned_to field fix
 * ✓ 7-day activity check (not daily login)
 */

const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || 'LeadFlow_Meta_2026_Premium';

// Working Hours (IST)
const WORKING_HOURS = {
    START: 8,   // 8 AM
    END: 22,    // 10 PM
    TIMEZONE: 'Asia/Kolkata'
};

// Round thresholds for distribution
const ROUND_THRESHOLDS = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45];

// ============================================================================
// 🗺️ CITY TO STATE MAPPING - COMPREHENSIVE
// ============================================================================
const CITY_STATE_MAP: Record<string, string> = {
    // PUNJAB - ALL CITIES
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

    // HARYANA - ALL CITIES
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

    // HIMACHAL PRADESH
    'shimla': 'himachal pradesh', 'manali': 'himachal pradesh', 'dharamshala': 'himachal pradesh',
    'mcleodganj': 'himachal pradesh', 'kullu': 'himachal pradesh', 'kasol': 'himachal pradesh',
    'dalhousie': 'himachal pradesh', 'khajjiar': 'himachal pradesh', 'solan': 'himachal pradesh',
    'baddi': 'himachal pradesh', 'parwanoo': 'himachal pradesh', 'kasauli': 'himachal pradesh',
    'nahan': 'himachal pradesh', 'paonta sahib': 'himachal pradesh', 'una': 'himachal pradesh',
    'hamirpur': 'himachal pradesh', 'bilaspur': 'himachal pradesh', 'mandi': 'himachal pradesh',
    'chamba': 'himachal pradesh', 'kangra': 'himachal pradesh', 'palampur': 'himachal pradesh',
    'sundernagar': 'himachal pradesh', 'nalagarh': 'himachal pradesh', 'keylong': 'himachal pradesh',
    'kaza': 'himachal pradesh', 'kalpa': 'himachal pradesh', 'kinnaur': 'himachal pradesh', 'banjar': 'himachal pradesh',

    // UTTARAKHAND
    'dehradun': 'uttarakhand', 'mussoorie': 'uttarakhand', 'rishikesh': 'uttarakhand',
    'haridwar': 'uttarakhand', 'nainital': 'uttarakhand', 'haldwani': 'uttarakhand',
    'rudrapur': 'uttarakhand', 'kashipur': 'uttarakhand', 'roorkee': 'uttarakhand',
    'kotdwar': 'uttarakhand', 'pauri': 'uttarakhand', 'almora': 'uttarakhand',
    'ranikhet': 'uttarakhand', 'pithoragarh': 'uttarakhand', 'champawat': 'uttarakhand',
    'uttarkashi': 'uttarakhand', 'tehri': 'uttarakhand', 'chamoli': 'uttarakhand',
    'rudraprayag': 'uttarakhand', 'bageshwar': 'uttarakhand', 'joshimath': 'uttarakhand',
    'badrinath': 'uttarakhand', 'kedarnath': 'uttarakhand', 'gangotri': 'uttarakhand',

    // MAHARASHTRA
    'mumbai': 'maharashtra', 'pune': 'maharashtra', 'nagpur': 'maharashtra',
    'thane': 'maharashtra', 'nashik': 'maharashtra', 'aurangabad': 'maharashtra',
    'solapur': 'maharashtra', 'kolhapur': 'maharashtra', 'navi mumbai': 'maharashtra',
    'andheri': 'maharashtra', 'bandra': 'maharashtra', 'borivali': 'maharashtra',

    // RAJASTHAN
    'jaipur': 'rajasthan', 'jodhpur': 'rajasthan', 'udaipur': 'rajasthan',
    'kota': 'rajasthan', 'ajmer': 'rajasthan', 'bikaner': 'rajasthan',
    'alwar': 'rajasthan', 'bhilwara': 'rajasthan', 'sikar': 'rajasthan',

    // JAMMU & KASHMIR
    'jammu': 'jammu kashmir', 'srinagar': 'jammu kashmir', 'leh': 'jammu kashmir',
    'ladakh': 'jammu kashmir', 'kargil': 'jammu kashmir', 'anantnag': 'jammu kashmir',

    // OTHER STATES
    'lucknow': 'uttar pradesh', 'agra': 'uttar pradesh', 'varanasi': 'uttar pradesh',
    'azamgarh': 'uttar pradesh', 'chandauli': 'uttar pradesh', 'jalalapur': 'uttar pradesh',
    'bengaluru': 'karnataka', 'bangalore': 'karnataka', 'mysore': 'karnataka',
    'chennai': 'tamil nadu', 'coimbatore': 'tamil nadu', 'madurai': 'tamil nadu',
    'kolkata': 'west bengal', 'howrah': 'west bengal',
    'hyderabad': 'telangana', 'secunderabad': 'telangana',
    'ahmedabad': 'gujarat', 'surat': 'gujarat', 'vadodara': 'gujarat',
    'bhopal': 'madhya pradesh', 'indore': 'madhya pradesh',
    'patna': 'bihar', 'ranchi': 'jharkhand', 'bhubaneswar': 'odisha',
    'guwahati': 'assam', 'imphal': 'manipur', 'shillong': 'meghalaya',
    'goa': 'goa', 'panaji': 'goa',
};

// State aliases for normalization
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

function getCurrentRound(leadsToday: number): number {
    for (let i = 0; i < ROUND_THRESHOLDS.length; i++) {
        if (leadsToday < ROUND_THRESHOLDS[i]) return i;
    }
    return ROUND_THRESHOLDS.length;
}

function getLeadsNeededForRound(leadsToday: number): number {
    const round = getCurrentRound(leadsToday);
    if (round >= ROUND_THRESHOLDS.length) return 0;
    return ROUND_THRESHOLDS[round] - leadsToday;
}

function getRemainingCapacity(leadsToday: number, dailyLimit: number): number {
    return Math.max(0, dailyLimit - leadsToday);
}

function isWithinWorkingHours(): boolean {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", { timeZone: WORKING_HOURS.TIMEZONE }));
    const hour = istTime.getHours();
    const isWorking = hour >= WORKING_HOURS.START && hour < WORKING_HOURS.END;
    console.log(`⏰ IST: ${istTime.toLocaleTimeString()} | Working: ${isWorking ? 'YES' : 'NO'}`);
    return isWorking;
}

/**
 * Detect state from city name
 */
function detectStateFromCity(city: string): string {
    const cityNorm = city.toLowerCase().trim();

    // Direct lookup
    if (CITY_STATE_MAP[cityNorm]) {
        return CITY_STATE_MAP[cityNorm];
    }

    // Partial match
    for (const [cityKey, state] of Object.entries(CITY_STATE_MAP)) {
        if (cityNorm.includes(cityKey) || cityKey.includes(cityNorm)) {
            return state;
        }
    }

    return 'unknown';
}

/**
 * Normalize state name
 */
function normalizeState(state: string): string {
    const stateNorm = state.toLowerCase().trim();
    return STATE_ALIASES[stateNorm] || stateNorm;
}

/**
 * Check if user matches lead's state preference
 */
function matchesStatePreference(userState: string, leadState: string): boolean {
    const userStateNorm = normalizeState(userState || 'all india');
    const leadStateNorm = normalizeState(leadState || 'unknown');

    // All India accepts all leads
    if (userStateNorm === 'all india') return true;

    // Unknown lead state = only All India users
    if (leadStateNorm === 'unknown') return false;

    // Direct or partial match
    return userStateNorm === leadStateNorm ||
        userStateNorm.includes(leadStateNorm) ||
        leadStateNorm.includes(userStateNorm);
}

/**
 * Check gender preference - "any" accepts all
 */
function matchesGenderPreference(userGender: string, leadGender: string): boolean {
    const userG = (userGender || 'any').toLowerCase().trim();
    const leadG = (leadGender || 'any').toLowerCase().trim();

    if (userG === 'any' || leadG === 'any' || leadG === 'unknown') return true;
    return userG === leadG;
}

/**
 * Validate Indian phone number - starts with 6/7/8/9
 */
function isValidIndianPhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '').slice(-10);
    return cleaned.length === 10 &&
        !cleaned.startsWith('0000') &&
        /^[6-9]\d{9}$/.test(cleaned);  // ✅ 6, 7, 8, 9 all valid
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

    // ===== GET: Webhook Verification =====
    if (method === 'GET') {
        const url = new URL(req.url);
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ Webhook Verified');
            return new Response(challenge, { status: 200 });
        }
        return new Response('Forbidden', { status: 403 });
    }

    // ===== POST: Lead Processing =====
    if (method === 'POST') {
        try {
            const payload = await req.json();
            console.log('📥 Webhook v24 - Smart Distribution');

            for (const entry of payload.entry || []) {
                const pageId = entry.id;

                for (const change of entry.changes) {
                    if (change.field !== 'leadgen') continue;

                    const leadgenId = change.value.leadgen_id;
                    console.log(`🚀 Lead: ${leadgenId}`);

                    // 1. GET PAGE DATA
                    const { data: pageData, error: pageError } = await supabase
                        .from('connected_pages')
                        .select('*')
                        .eq('page_id', pageId)
                        .eq('is_active', true)
                        .single();

                    if (pageError || !pageData) {
                        console.error(`❌ Page not found: ${pageId}`);
                        continue;
                    }

                    // 2. FETCH LEAD FROM META
                    const metaRes = await fetch(
                        `https://graph.facebook.com/v18.0/${leadgenId}?access_token=${pageData.access_token}`
                    );
                    const leadData = await metaRes.json();

                    if (leadData.error) {
                        console.error('❌ Meta Error:', leadData.error.message);
                        continue;
                    }

                    // Parse fields
                    const fields: Record<string, string> = {};
                    leadData.field_data?.forEach((f: any) => {
                        fields[f.name] = f.values?.[0] || '';
                    });

                    const leadName = fields.full_name || fields.first_name || 'Enquiry';

                    // Phone extraction - multiple field names
                    let rawPhone = fields.phone_number || fields.phoneNumber || fields.phone ||
                        fields.contact_number || fields.mobile || fields.Mobile ||
                        fields.contact || fields.Contact || '';

                    if (!rawPhone) {
                        const phoneKey = Object.keys(fields).find(k =>
                            k.toLowerCase().match(/phone|mobile|contact|number/)
                        );
                        if (phoneKey) rawPhone = fields[phoneKey];
                    }

                    const leadPhone = (rawPhone || '').replace(/\D/g, '').slice(-10);
                    const leadCity = (fields.city || 'India').toLowerCase().trim();
                    const leadGender = (fields.gender || 'any').toLowerCase();  // ✅ Default: any
                    const rawState = (fields.state || fields.region || '').toLowerCase();

                    console.log(`👤 ${leadName} | ${leadPhone} | ${leadCity}`);

                    // ======= VALIDATION 1: TEST LEAD =======
                    if (leadName.toLowerCase().includes('test') || leadName.toLowerCase().includes('dummy')) {
                        console.log('🧪 TEST LEAD');
                        await supabase.from('leads').insert({
                            name: `[TEST] ${leadName}`,
                            phone: 'TEST',
                            city: leadCity,
                            state: rawState,
                            source: `Meta - ${pageData.page_name} [TEST]`,
                            status: 'Test',
                            created_at: new Date().toISOString()
                        });
                        continue;
                    }

                    // ======= VALIDATION 2: PHONE (6/7/8/9 valid) =======
                    if (!isValidIndianPhone(leadPhone)) {
                        console.log(`❌ INVALID PHONE: ${leadPhone}`);
                        await supabase.from('leads').insert({
                            name: leadName,
                            phone: leadPhone || 'INVALID',
                            city: leadCity,
                            state: rawState,
                            source: `Meta - ${pageData.page_name}`,
                            status: 'Invalid',
                            is_valid_phone: false,
                            notes: `Raw: ${rawPhone} | Fields: ${JSON.stringify(fields).substring(0, 300)}`,
                            created_at: new Date().toISOString()
                        });
                        continue;
                    }

                    // ======= VALIDATION 3: DUPLICATE (30 days) =======
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                    const { data: existingLead } = await supabase
                        .from('leads')
                        .select('id')
                        .eq('phone', leadPhone)
                        .gte('created_at', thirtyDaysAgo.toISOString())
                        .limit(1);

                    if (existingLead && existingLead.length > 0) {
                        console.log(`🔄 DUPLICATE: ${leadPhone}`);
                        await supabase.from('leads').insert({
                            name: leadName,
                            phone: leadPhone,
                            city: leadCity,
                            state: rawState,
                            source: `Meta - ${pageData.page_name}`,
                            status: 'Duplicate',
                            created_at: new Date().toISOString()
                        });
                        continue;
                    }

                    // ======= WORKING HOURS CHECK =======
                    if (!isWithinWorkingHours()) {
                        console.log('🌙 NIGHT - Saving as Backlog');
                        await supabase.from('leads').insert({
                            name: leadName,
                            phone: leadPhone,
                            city: leadCity,
                            state: rawState,
                            source: `Meta - ${pageData.page_name}`,
                            status: 'Night_Backlog',
                            is_valid_phone: true,
                            created_at: new Date().toISOString()
                        });
                        continue;
                    }

                    // 3. DETECT STATE FROM CITY
                    let leadState = detectStateFromCity(leadCity);
                    if (leadState === 'unknown' && rawState) {
                        leadState = normalizeState(rawState);
                    }
                    console.log(`📍 ${leadCity} → ${leadState}`);

                    // 4. GET ELIGIBLE USERS
                    const { data: allUsers, error: usersError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('is_active', true)
                        .neq('plan_name', 'none')
                        .or('is_plan_pending.is.null,is_plan_pending.eq.false');

                    if (usersError || !allUsers || allUsers.length === 0) {
                        console.error('❌ No active users');
                        await supabase.from('leads').insert({
                            name: leadName, phone: leadPhone, city: leadCity, state: leadState,
                            source: `Meta - ${pageData.page_name}`,
                            status: 'New', is_valid_phone: true,
                            created_at: new Date().toISOString()
                        });
                        continue;
                    }

                    // 4.5 TEAM FILTER (if page has manager)
                    let teamFilteredUsers = allUsers;
                    if (pageData.manager_id) {
                        const teamUsers = allUsers.filter(u =>
                            u.manager_id === pageData.manager_id || u.id === pageData.manager_id
                        );
                        if (teamUsers.length > 0) {
                            console.log(`👥 Team: ${teamUsers.length} members`);
                            teamFilteredUsers = teamUsers;
                        }
                    }

                    // 5. FILTER ELIGIBLE USERS
                    const now = new Date();
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                    const eligibleUsers = teamFilteredUsers.filter(user => {
                        const leadsToday = user.leads_today || 0;
                        const dailyLimit = user.daily_limit || 0;

                        // ❌ Skip if limit reached
                        if (leadsToday >= dailyLimit) return false;

                        // ❌ Skip if paused (daily_limit = 0)
                        if (dailyLimit <= 0) {
                            console.log(`⏸️ ${user.name} - Paused (limit=0)`);
                            return false;
                        }

                        // ❌ Skip if is_active is false (user paused themselves)
                        if (!user.is_active) {
                            console.log(`⏸️ ${user.name} - is_active=false`);
                            return false;
                        }

                        // ✅ NEW: 30-Minute Waiting Period for New Plans
                        if (user.plan_activation_time) {
                            const activationTime = new Date(user.plan_activation_time);
                            const waitTime = new Date(activationTime.getTime() + 30 * 60000); // +30 Minutes
                            if (now < waitTime) {
                                const remainingMins = Math.ceil((waitTime.getTime() - now.getTime()) / 60000);
                                console.log(`⏳ ${user.name} - Warming up (Wait ${remainingMins}m)`);
                                return false;
                            }
                        }

                        // ✅ Check valid subscription
                        const validUntil = user.valid_until ? new Date(user.valid_until) : null;
                        if (!validUntil || validUntil < now) {
                            console.log(`⏳ ${user.name} - Subscription expired`);
                            return false;
                        }

                        // ✅ Check activity within 7 days
                        const lastActivity = user.last_activity ? new Date(user.last_activity) : null;
                        if (!lastActivity || lastActivity < sevenDaysAgo) {
                            console.log(`⏳ ${user.name} - Inactive 7+ days`);
                            return false;
                        }

                        // ✅ Check gender preference - DISABLED (Pan India distribution)
                        // if (!matchesGenderPreference(user.target_gender, leadGender)) {
                        //     return false;
                        // }

                        // ✅ Check state preference - DISABLED (All users are now All India)
                        // if (!matchesStatePreference(user.target_state, leadState)) {
                        //     return false;
                        // }

                        return true;
                    });

                    if (eligibleUsers.length === 0) {
                        console.log('⚠️ No eligible users');
                        await supabase.from('leads').insert({
                            name: leadName, phone: leadPhone, city: leadCity, state: leadState,
                            source: `Meta - ${pageData.page_name}`,
                            status: 'New', is_valid_phone: true,
                            created_at: new Date().toISOString()
                        });
                        continue;
                    }

                    // 6. SMART ROUND ROBIN SORT
                    // Logic: Old Users First -> Then Round Balance
                    eligibleUsers.sort((a, b) => {
                        const leadsA = a.leads_today || 0;
                        const leadsB = b.leads_today || 0;
                        const limitA = a.daily_limit || 0;
                        const limitB = b.daily_limit || 0;

                        // ✅ PRIORITY 0: Old Users First (Protect Flow)
                        // "New User" = Plan activated in last 24 hours
                        const isNewA = a.plan_activation_time && new Date(a.plan_activation_time).getTime() > (Date.now() - 86400000);
                        const isNewB = b.plan_activation_time && new Date(b.plan_activation_time).getTime() > (Date.now() - 86400000);

                        if (!isNewA && isNewB) return -1; // Old User First
                        if (isNewA && !isNewB) return 1;  // New User Last

                        // PRIORITY 1: Lower round first
                        const roundA = getCurrentRound(leadsA);
                        const roundB = getCurrentRound(leadsB);
                        if (roundA !== roundB) return roundA - roundB;

                        // PRIORITY 2: Lower need first
                        const neededA = Math.min(getLeadsNeededForRound(leadsA), getRemainingCapacity(leadsA, limitA));
                        const neededB = Math.min(getLeadsNeededForRound(leadsB), getRemainingCapacity(leadsB, limitB));
                        if (neededA !== neededB) return neededA - neededB;

                        // PRIORITY 3: Higher leads first
                        if (leadsA !== leadsB) return leadsB - leadsA;

                        return (a.id || '').localeCompare(b.id || '');
                    });

                    const selectedUser = eligibleUsers[0];
                    const currentLeads = selectedUser.leads_today || 0;
                    const newCount = currentLeads + 1;

                    console.log(`✅ ${leadName} → ${selectedUser.name} (Round ${getCurrentRound(currentLeads)})`);

                    // 7. INSERT LEAD
                    await supabase.from('leads').insert({
                        name: leadName,
                        phone: leadPhone,
                        city: leadCity,
                        state: leadState,
                        source: `Meta - ${pageData.page_name}`,
                        status: 'Assigned',
                        user_id: selectedUser.id,
                        assigned_to: selectedUser.id,  // ✅ Both fields set
                        assigned_at: new Date().toISOString(),
                        is_valid_phone: true,
                        created_at: new Date().toISOString()
                    });

                    // 8. UPDATE USER COUNT (ATOMIC RPC)
                    // Uses RPC to prevent race conditions with Backlog Distributor
                    const { error: rpcError } = await supabase.rpc('increment_leads_today', { user_id: selectedUser.id });

                    if (rpcError) {
                        // Fallback if RPC fails (though unlikely)
                        console.error('⚠️ RPC Error, using manual update:', rpcError);
                        await supabase
                            .from('users')
                            .update({
                                leads_today: newCount,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', selectedUser.id);
                    }

                    console.log(`✅ ${selectedUser.name}: Leads updated (RPC)`);
                }
            }

            return new Response('EVENT_RECEIVED', { status: 200 });
        } catch (error: any) {
            console.error('❌ Error:', error.message);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    return new Response('Method Not Allowed', { status: 405 });
});
