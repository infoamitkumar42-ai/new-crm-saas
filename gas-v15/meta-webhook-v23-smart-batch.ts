import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * LEADFLOW WEBHOOK v23.0 - SMART BATCH DISTRIBUTION
 * ==================================================
 * 
 * DISTRIBUTION LOGIC:
 * - Round 1: Everyone gets 1 lead
 * - Round 2: Everyone gets 2 leads (total: 3)
 * - Round 3: Everyone gets 3 leads (total: 6)
 * - Round 4: Everyone gets 4 leads (total: 10)
 * - Round 5: Everyone gets 5 leads (total: 15)
 * 
 * SMART CAP:
 * - Never exceeds daily_limit
 * - Example: Starter (limit=5) gets 1+2+2=5 (capped at round 3)
 * 
 * FEATURES:
 * ✓ Round-based batch distribution
 * ✓ Daily limit cap
 * ✓ Independent user rounds
 * ✓ Working Hours: 8 AM - 10 PM (IST)
 * ✓ City/State preference matching
 * ✓ Gender preference matching
 * ✓ New user priority (starts at Round 1)
 */

const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || 'LeadFlow_Meta_2026_Premium';

// Working Hours (IST)
const WORKING_HOURS = {
    START: 8,   // 8 AM
    END: 22,    // 10 PM
    TIMEZONE: 'Asia/Kolkata'
};

// Round thresholds: leads_today value at start of each round
// Round 1: 0 leads → after round: 1
// Round 2: 1 lead → after round: 3 (1+2)
// Round 3: 3 leads → after round: 6 (3+3)
// Round 4: 6 leads → after round: 10 (6+4)
// Round 5: 10 leads → after round: 15 (10+5)
const ROUND_THRESHOLDS = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45];

// State aliases for matching - ALL INDIAN STATES
const STATE_ALIASES: Record<string, string[]> = {
    // North India
    'punjab': ['punjab', 'pb', 'panjab', 'ludhiana', 'amritsar', 'jalandhar', 'patiala'],
    'haryana': ['haryana', 'hr', 'gurugram', 'gurgaon', 'faridabad', 'rohtak'],
    'himachal pradesh': ['himachal pradesh', 'himachal', 'hp', 'shimla', 'manali'],
    'uttarakhand': ['uttarakhand', 'uk', 'uttaranchal', 'dehradun', 'haridwar'],
    'uttar pradesh': ['uttar pradesh', 'up', 'lucknow', 'noida', 'agra', 'varanasi'],
    'rajasthan': ['rajasthan', 'rj', 'jaipur', 'jodhpur', 'udaipur'],
    'jammu and kashmir': ['jammu', 'kashmir', 'jk', 'srinagar'],
    'ladakh': ['ladakh', 'leh', 'leh ladakh'],

    // Union Territories
    'chandigarh': ['chandigarh', 'chd'],
    'delhi': ['delhi', 'ncr', 'new delhi', 'south delhi', 'north delhi'],

    // Central India
    'madhya pradesh': ['madhya pradesh', 'mp', 'bhopal', 'indore'],
    'chhattisgarh': ['chhattisgarh', 'cg', 'raipur'],

    // West India
    'maharashtra': ['maharashtra', 'mh', 'mumbai', 'pune', 'nagpur', 'thane'],
    'gujarat': ['gujarat', 'gj', 'ahmedabad', 'surat', 'vadodara'],
    'goa': ['goa'],

    // South India
    'karnataka': ['karnataka', 'ka', 'bangalore', 'bengaluru', 'mysore'],
    'tamil nadu': ['tamil nadu', 'tn', 'chennai', 'coimbatore', 'madurai'],
    'kerala': ['kerala', 'kl', 'kochi', 'thiruvananthapuram', 'trivandrum'],
    'andhra pradesh': ['andhra pradesh', 'ap', 'visakhapatnam', 'vijayawada'],
    'telangana': ['telangana', 'ts', 'hyderabad', 'secunderabad'],

    // East India
    'west bengal': ['west bengal', 'wb', 'kolkata', 'calcutta', 'howrah'],
    'bihar': ['bihar', 'br', 'patna'],
    'jharkhand': ['jharkhand', 'jh', 'ranchi', 'jamshedpur'],
    'odisha': ['odisha', 'orissa', 'or', 'bhubaneswar'],

    // Northeast India
    'assam': ['assam', 'as', 'guwahati'],
    'manipur': ['manipur', 'mn', 'imphal'],
    'meghalaya': ['meghalaya', 'ml', 'shillong'],
    'tripura': ['tripura', 'tr', 'agartala'],
    'arunachal pradesh': ['arunachal pradesh', 'ar', 'itanagar'],
    'nagaland': ['nagaland', 'nl', 'kohima'],
    'mizoram': ['mizoram', 'mz', 'aizawl'],
    'sikkim': ['sikkim', 'sk', 'gangtok'],

    // All India
    'all india': ['all india', 'india', 'all', 'pan india', 'nationwide']
};

/**
 * Get user's current round based on leads_today
 * Round 1: leads_today = 0
 * Round 2: leads_today = 1
 * Round 3: leads_today = 3
 * etc.
 */
function getCurrentRound(leadsToday: number): number {
    for (let i = 0; i < ROUND_THRESHOLDS.length; i++) {
        if (leadsToday < ROUND_THRESHOLDS[i]) {
            return i;
        }
    }
    return ROUND_THRESHOLDS.length;
}

/**
 * Get how many leads needed to complete current round
 * Example: 
 * - leads_today=0, round=1 → need 1 to reach threshold[1]=1
 * - leads_today=1, round=2 → need 2 to reach threshold[2]=3
 * - leads_today=2, round=2 → need 1 to reach threshold[2]=3
 */
function getLeadsNeededForRound(leadsToday: number): number {
    const round = getCurrentRound(leadsToday);
    if (round >= ROUND_THRESHOLDS.length) return 0;

    const targetForRound = ROUND_THRESHOLDS[round];
    return targetForRound - leadsToday;
}

/**
 * Get leads remaining until daily limit
 */
function getRemainingCapacity(leadsToday: number, dailyLimit: number): number {
    return Math.max(0, dailyLimit - leadsToday);
}

/**
 * Check if within working hours (8 AM - 10 PM IST)
 */
function isWithinWorkingHours(): boolean {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", { timeZone: WORKING_HOURS.TIMEZONE }));
    const hour = istTime.getHours();

    const isWorking = hour >= WORKING_HOURS.START && hour < WORKING_HOURS.END;
    console.log(`⏰ IST Time: ${istTime.toLocaleTimeString()} | Working Hours: ${isWorking ? 'YES' : 'NO'}`);

    return isWorking;
}

/**
 * Check if user matches lead's state/city preference
 */
function matchesStatePreference(userState: string, leadState: string): boolean {
    const userStateNorm = (userState || 'All India').toLowerCase().trim();
    const leadStateNorm = (leadState || 'Unknown').toLowerCase().trim();

    // All India accepts all leads
    if (userStateNorm === 'all india' || userStateNorm === 'all' || userStateNorm === 'india') {
        return true;
    }

    // Unknown lead state = only All India users can take
    if (leadStateNorm === 'unknown') {
        return false;
    }

    // Direct match
    if (userStateNorm.replace(/\s/g, '') === leadStateNorm.replace(/\s/g, '')) {
        return true;
    }

    // Check aliases
    for (const [state, aliases] of Object.entries(STATE_ALIASES)) {
        const stateNorm = state.replace(/\s/g, '').toLowerCase();
        if (stateNorm === leadStateNorm.replace(/\s/g, '')) {
            if (aliases.some(alias => userStateNorm.includes(alias))) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Check if user matches lead's gender preference
 */
function matchesGenderPreference(userGender: string, leadGender: string): boolean {
    const userGenderNorm = (userGender || 'Any').toLowerCase().trim();
    const leadGenderNorm = (leadGender || 'unknown').toLowerCase().trim();

    // Any accepts all genders
    if (userGenderNorm === 'any') {
        return true;
    }

    // Unknown lead gender = accept
    if (leadGenderNorm === 'unknown') {
        return true;
    }

    // Direct match
    return userGenderNorm === leadGenderNorm;
}

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

    // ===== POST: Lead Reception & Smart Batch Distribution =====
    if (method === 'POST') {
        try {
            const payload = await req.json();
            console.log('📥 Webhook Received (v23 - Smart Batch)');

            for (const entry of payload.entry || []) {
                const pageId = entry.id;

                for (const change of entry.changes) {
                    if (change.field !== 'leadgen') continue;

                    const leadgenId = change.value.leadgen_id;
                    console.log(`🚀 Processing Lead: ${leadgenId}`);

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
                    // Improve phone extraction - try multiple field names
                    let rawPhone = fields.phone_number || fields.phoneNumber || fields.phone || fields.contact_number || fields.mobile || fields.Mobile || fields.contact || '';

                    // If still empty, search for any key containing 'phone', 'mobile', or 'contact'
                    if (!rawPhone) {
                        const phoneKey = Object.keys(fields).find(k => k.toLowerCase().match(/phone|mobile|contact/));
                        if (phoneKey) rawPhone = fields[phoneKey];
                    }

                    const leadPhone = (rawPhone || '').replace(/\D/g, '').slice(-10);
                    const leadCity = (fields.city || 'India').toLowerCase().trim();
                    const leadGender = (fields.gender || 'any').toLowerCase(); // ✅ FIX: Default to 'any' not 'Female'
                    const state = (fields.state || fields.region || '').toLowerCase(); // state extraction

                    console.log(`👤 Lead: ${leadName} | Raw: ${rawPhone} | Parsed: ${leadPhone} | ${leadCity}`);

                    // ======= VALIDATION 1: TEST LEAD =======
                    if (leadName.includes('test lead') || leadName.includes('dummy data')) {
                        console.log('🧪 TEST LEAD - Skip');
                        await supabase.from('leads').insert({
                            name: `[TEST] ${leadName}`,
                            phone: 'TEST',
                            city: leadCity,
                            state: state,
                            source: `Meta - ${pageData.page_name} [TEST]`,
                            status: 'Test',
                            created_at: new Date().toISOString()
                        });
                        continue;
                    }

                    // ======= VALIDATION 2: INVALID PHONE =======
                    const isValidPhone = leadPhone.length === 10 &&
                        !leadPhone.startsWith('0000') &&
                        /^[6-9]\d{9}$/.test(leadPhone);

                    if (!isValidPhone) {
                        console.log(`❌ INVALID PHONE: ${leadPhone} (Raw: ${rawPhone})`);
                        console.log('📋 Received Fields:', JSON.stringify(fields)); // Debug log

                        // Insert as Invalid to track - ADDED DEBUG NOTES
                        await supabase.from('leads').insert({
                            name: leadName,
                            phone: leadPhone || 'INVALID',
                            city: leadCity,
                            state: state,
                            source: `Meta - ${pageData.page_name}`,
                            status: 'Invalid',
                            is_valid_phone: false,
                            notes: `Raw Fields: ${JSON.stringify(fields).substring(0, 500)}`, // Save raw data to debug
                            created_at: new Date().toISOString()
                        });
                        continue;
                    }

                    // ======= VALIDATION 3: DUPLICATE (within 30 days) =======
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                    const { data: existingLead } = await supabase
                        .from('leads')
                        .select('id')
                        .eq('phone', leadPhone)
                        .gte('created_at', thirtyDaysAgo.toISOString()) // ✅ FIX: Only check last 30 days
                        .limit(1);

                    if (existingLead && existingLead.length > 0) {
                        console.log(`🔄 DUPLICATE: ${leadPhone}`);
                        await supabase.from('leads').insert({
                            name: leadName,
                            phone: leadPhone,
                            city: leadCity,
                            state: state,
                            source: `Meta - ${pageData.page_name}`,
                            status: 'Duplicate',
                            created_at: new Date().toISOString()
                        });
                        continue;
                    }

                    // ======= CHECK WORKING HOURS =======
                    if (!isWithinWorkingHours()) {
                        console.log('🌙 OUTSIDE WORKING HOURS - Saving as Night_Backlog');
                        await supabase.from('leads').insert({
                            name: leadName,
                            phone: leadPhone,
                            city: leadCity,
                            state: state,  // ✅ FIX: Added missing state field
                            source: `Meta - ${pageData.page_name}`,
                            status: 'Night_Backlog',
                            is_valid_phone: true,
                            created_at: new Date().toISOString()
                        });
                        continue;
                    }

                    // 3. DETECT LEAD'S STATE FROM CITY
                    let leadState = 'Unknown';

                    const { data: cityMapping } = await supabase
                        .from('city_state_mapping')
                        .select('state')
                        .eq('city', leadCity)
                        .single();

                    if (cityMapping) {
                        leadState = cityMapping.state;
                    } else {
                        for (const [state, aliases] of Object.entries(STATE_ALIASES)) {
                            if (aliases.some(alias => leadCity.includes(alias))) {
                                leadState = state;
                                break;
                            }
                        }
                    }

                    console.log(`📍 City: ${leadCity} → State: ${leadState}`);

                    // 4. GET ALL ACTIVE USERS WITH VALID PLAN
                    const { data: allUsers, error: usersError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('is_active', true)
                        .neq('plan_name', 'none')
                        .or('is_plan_pending.is.null,is_plan_pending.eq.false');

                    if (usersError || !allUsers || allUsers.length === 0) {
                        console.error('❌ No active users');
                        await supabase.from('leads').insert({
                            name: leadName,
                            phone: leadPhone,
                            city: leadCity,
                            state: leadState,
                            source: `Meta - ${pageData.page_name}`,
                            status: 'New',
                            is_valid_phone: true,
                            created_at: new Date().toISOString()
                        });
                        continue;
                    }

                    // 4.5 TEAM-BASED FILTERING
                    // If page has a manager_id, prioritize users under that manager
                    let teamFilteredUsers = allUsers;
                    const pageManagerId = pageData.manager_id;

                    if (pageManagerId) {
                        // Filter users who belong to this manager's team
                        const teamUsers = allUsers.filter(user =>
                            user.manager_id === pageManagerId || user.id === pageManagerId
                        );

                        if (teamUsers.length > 0) {
                            console.log(`👥 Team filter: ${pageData.page_name} → Manager ${pageData.manager_name} (${teamUsers.length} team members)`);
                            teamFilteredUsers = teamUsers;
                        } else {
                            // Fallback: If no team members qualify, use all users
                            console.log(`⚠️ No team members for ${pageData.page_name}, using all users`);
                        }
                    } else {
                        console.log(`🌐 No manager set for ${pageData.page_name}, distributing to all users`);
                    }

                    // 5. FILTER ELIGIBLE USERS
                    // Must have capacity AND match preferences AND logged in today

                    // Calculate today's 8 AM IST in UTC for login check
                    const now = new Date();
                    const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
                    const todayStart = new Date(istNow);
                    todayStart.setHours(8, 0, 0, 0); // 8 AM IST
                    // Convert back to UTC for comparison
                    const todayStartUTC = new Date(todayStart.getTime() - (5.5 * 60 * 60 * 1000)); // IST is UTC+5:30

                    const eligibleUsers = teamFilteredUsers.filter(user => {
                        const leadsToday = user.leads_today || 0;
                        const dailyLimit = user.daily_limit || 0;

                        // Skip if daily limit reached
                        if (leadsToday >= dailyLimit) {
                            return false;
                        }

                        // Skip if daily_limit is 0 (paused or not configured)
                        if (dailyLimit <= 0) {
                            return false;
                        }

                        // ✅ FIX: Relaxed login check - check if subscription is valid
                        // Instead of requiring daily login, check if user has valid subscription
                        const validUntil = user.valid_until ? new Date(user.valid_until) : null;
                        const now = new Date();

                        // Skip if subscription expired
                        if (!validUntil || validUntil < now) {
                            console.log(`⏳ ${user.name} - Subscription expired (valid_until: ${validUntil?.toISOString() || 'never'})`);
                            return false;
                        }

                        // Optional: Check last activity within 7 days (not daily)
                        const lastActivity = user.last_activity ? new Date(user.last_activity) : null;
                        const sevenDaysAgo = new Date();
                        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                        if (!lastActivity || lastActivity < sevenDaysAgo) {
                            console.log(`⏳ ${user.name} - Inactive for 7+ days (last: ${lastActivity?.toISOString() || 'never'})`);
                            return false;
                        }

                        // Check gender preference
                        if (!matchesGenderPreference(user.target_gender, leadGender)) {
                            return false;
                        }

                        // Check state preference
                        if (!matchesStatePreference(user.target_state, leadState)) {
                            return false;
                        }

                        return true;
                    });

                    if (eligibleUsers.length === 0) {
                        console.log('⚠️ No eligible users - saving as New');
                        await supabase.from('leads').insert({
                            name: leadName,
                            phone: leadPhone,
                            city: leadCity,
                            state: leadState,
                            source: `Meta - ${pageData.page_name}`,
                            status: 'New',
                            is_valid_phone: true,
                            created_at: new Date().toISOString()
                        });
                        continue;
                    }

                    // 6. SMART BATCH DISTRIBUTION - Sort by priority
                    eligibleUsers.sort((a, b) => {
                        const leadsA = a.leads_today || 0;
                        const leadsB = b.leads_today || 0;
                        const limitA = a.daily_limit || 0;
                        const limitB = b.daily_limit || 0;

                        // PRIORITY 1: User's current round (lower round = higher priority)
                        const roundA = getCurrentRound(leadsA);
                        const roundB = getCurrentRound(leadsB);
                        if (roundA !== roundB) {
                            return roundA - roundB;  // Lower round first
                        }

                        // PRIORITY 2: Within same round, user who needs more leads
                        // This ensures we complete one user's round before moving to next
                        const neededA = getLeadsNeededForRound(leadsA);
                        const neededB = getLeadsNeededForRound(leadsB);

                        // But also cap by remaining capacity
                        const remainingA = getRemainingCapacity(leadsA, limitA);
                        const remainingB = getRemainingCapacity(leadsB, limitB);

                        const actualNeedA = Math.min(neededA, remainingA);
                        const actualNeedB = Math.min(neededB, remainingB);

                        // User who needs MORE leads in this round gets priority
                        // This ensures same user keeps getting leads until round complete
                        if (actualNeedA !== actualNeedB) {
                            return actualNeedB - actualNeedA;  // Higher need first
                        }

                        // PRIORITY 3: If same need, lower leads_today first (fairness)
                        if (leadsA !== leadsB) {
                            return leadsA - leadsB;
                        }

                        // PRIORITY 4: Stable sort by ID
                        return (a.id || '').localeCompare(b.id || '');
                    });

                    const selectedUser = eligibleUsers[0];
                    const currentLeads = selectedUser.leads_today || 0;
                    const newCount = currentLeads + 1;
                    const currentRound = getCurrentRound(currentLeads);
                    const neededForRound = getLeadsNeededForRound(currentLeads);

                    console.log(`✅ SELECTED: ${selectedUser.name}`);
                    console.log(`   📊 Round ${currentRound} | Leads: ${currentLeads} → ${newCount} | Need ${neededForRound} more for round`);

                    // 7. INSERT LEAD
                    await supabase.from('leads').insert({
                        name: leadName,
                        phone: leadPhone,
                        city: leadCity,
                        state: leadState,
                        source: `Meta - ${pageData.page_name}`,
                        status: 'Assigned',
                        user_id: selectedUser.id,
                        assigned_to: selectedUser.id,  // ✅ BUG FIX: Added missing assigned_to field
                        assigned_at: new Date().toISOString(),
                        is_valid_phone: true,
                        created_at: new Date().toISOString()
                    });

                    // 8. UPDATE USER COUNT
                    await supabase
                        .from('users')
                        .update({
                            leads_today: newCount,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', selectedUser.id);

                    console.log(`✅ ${leadName} → ${selectedUser.name} (${leadCity}/${leadState})`);
                }
            }

            return new Response('EVENT_RECEIVED', { status: 200 });
        } catch (error) {
            console.error('❌ Error:', error.message);
            return new Response('Error', { status: 500 });
        }
    }

    return new Response('Method Not Allowed', { status: 405 });
});
