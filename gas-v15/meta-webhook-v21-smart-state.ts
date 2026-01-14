import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * LEADFLOW WEBHOOK v21.0 - SMART STATE MATCHING
 * ==============================================
 * ✓ City-to-State mapping (Punjab, Haryana, HP, UK, CHD)
 * ✓ Short forms supported (PB, HR, HP, UK, CHD)
 * ✓ Pure equal distribution
 * ✓ All validations
 */

const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || 'LeadFlow_Meta_2026_Premium';

// State aliases for matching
const STATE_ALIASES: Record<string, string[]> = {
    'punjab': ['punjab', 'pb', 'panjab'],
    'haryana': ['haryana', 'hr'],
    'himachal pradesh': ['himachal pradesh', 'himachal', 'hp'],
    'uttarakhand': ['uttarakhand', 'uk', 'uttaranchal'],
    'chandigarh': ['chandigarh', 'chd'],
    'delhi': ['delhi', 'ncr', 'new delhi'],
    'all india': ['all india', 'india', 'all']
};

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

    // ===== POST: Lead Reception & Distribution =====
    if (method === 'POST') {
        try {
            const payload = await req.json();
            console.log('📥 Webhook Received');

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
                    const leadPhone = (fields.phone_number || '').replace(/\D/g, '').slice(-10);
                    const leadCity = (fields.city || 'India').toLowerCase().trim();
                    const leadGender = (fields.gender || 'Female').toLowerCase();

                    console.log(`👤 Lead: ${leadName} | ${leadPhone} | ${leadCity}`);

                    // ======= VALIDATION 1: TEST LEAD =======
                    if (leadName.includes('test lead') || leadName.includes('dummy data')) {
                        console.log('🧪 TEST LEAD - Skip');
                        await supabase.from('leads').insert({
                            name: `[TEST] ${leadName}`,
                            phone: 'TEST',
                            city: leadCity,
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
                        console.log(`❌ INVALID PHONE: ${leadPhone}`);
                        await supabase.from('leads').insert({
                            name: leadName,
                            phone: leadPhone || 'INVALID',
                            city: leadCity,
                            source: `Meta - ${pageData.page_name}`,
                            status: 'Invalid',
                            is_valid_phone: false,
                            created_at: new Date().toISOString()
                        });
                        continue;
                    }

                    // ======= VALIDATION 3: DUPLICATE =======
                    const { data: existingLead } = await supabase
                        .from('leads')
                        .select('id')
                        .eq('phone', leadPhone)
                        .single();

                    if (existingLead) {
                        console.log(`🔄 DUPLICATE: ${leadPhone}`);
                        await supabase.from('leads').insert({
                            name: leadName,
                            phone: leadPhone,
                            city: leadCity,
                            source: `Meta - ${pageData.page_name}`,
                            status: 'Duplicate',
                            created_at: new Date().toISOString()
                        });
                        continue;
                    }

                    // 3. DETECT LEAD'S STATE FROM CITY
                    let leadState = 'Unknown';

                    // Try city_state_mapping table first
                    const { data: cityMapping } = await supabase
                        .from('city_state_mapping')
                        .select('state')
                        .eq('city', leadCity)
                        .single();

                    if (cityMapping) {
                        leadState = cityMapping.state;
                    } else {
                        // Check if city name contains state name
                        for (const [state, aliases] of Object.entries(STATE_ALIASES)) {
                            if (aliases.some(alias => leadCity.includes(alias))) {
                                leadState = state;
                                break;
                            }
                        }
                    }

                    console.log(`📍 City: ${leadCity} → State: ${leadState}`);

                    // 4. GET ALL ACTIVE USERS
                    const { data: allUsers, error: usersError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('is_active', true);

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

                    // 5. FILTER ELIGIBLE USERS
                    const eligibleUsers = allUsers.filter(user => {
                        // Daily limit check
                        if ((user.leads_today || 0) >= (user.daily_limit || 10)) return false;

                        // Gender check
                        const userGender = (user.target_gender || 'Any').toLowerCase();
                        if (userGender !== 'any' && leadGender !== 'unknown') {
                            if (userGender !== leadGender) return false;
                        }

                        // State check
                        const userState = (user.target_state || 'All India').toLowerCase();

                        // All India = accept all
                        if (userState === 'all india' || userState === 'all' || userState === 'india') {
                            return true;
                        }

                        // Unknown state lead - give to All India users only
                        if (leadState === 'Unknown') {
                            return false; // Will be handled by 'New' status
                        }

                        // Check state match using aliases
                        const userStateNormalized = userState.replace(' ', '').toLowerCase();
                        const leadStateNormalized = leadState.replace(' ', '').toLowerCase();

                        // Direct match
                        if (userStateNormalized === leadStateNormalized) return true;

                        // Alias match
                        for (const [state, aliases] of Object.entries(STATE_ALIASES)) {
                            const stateNorm = state.replace(' ', '').toLowerCase();
                            if (stateNorm === leadStateNormalized) {
                                // Lead is from this state, check if user targets it
                                if (aliases.some(alias => userState.includes(alias))) {
                                    return true;
                                }
                            }
                        }

                        return false;
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

                    // 6. SORT BY MIN LEADS (Equal Distribution)
                    eligibleUsers.sort((a, b) => {
                        const leadsA = a.leads_today || 0;
                        const leadsB = b.leads_today || 0;
                        if (leadsA !== leadsB) return leadsA - leadsB;
                        return (a.id || '').localeCompare(b.id || '');
                    });

                    const selectedUser = eligibleUsers[0];
                    const newCount = (selectedUser.leads_today || 0) + 1;

                    console.log(`✅ ${selectedUser.name} (${selectedUser.leads_today} → ${newCount})`);

                    // 7. INSERT LEAD
                    await supabase.from('leads').insert({
                        name: leadName,
                        phone: leadPhone,
                        city: leadCity,
                        state: leadState,
                        source: `Meta - ${pageData.page_name}`,
                        status: 'Assigned',
                        user_id: selectedUser.id,
                        assigned_at: new Date().toISOString(),
                        is_valid_phone: true,
                        created_at: new Date().toISOString()
                    });

                    // 8. UPDATE USER COUNT
                    await supabase
                        .from('users')
                        .update({ leads_today: newCount, updated_at: new Date().toISOString() })
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
