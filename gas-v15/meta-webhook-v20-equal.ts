import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * LEADFLOW WEBHOOK v20.0 - PURE EQUAL DISTRIBUTION
 * ==================================================
 * ✓ Pure min-leads rotation (sabko 1-1, fir 2-2)
 * ✓ No tier priority - sab equal
 * ✓ Gender/State preference matching
 * ✓ Invalid phone, duplicate, test lead detection
 * ✓ Works for 60 or 500+ users equally!
 */

const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || 'LeadFlow_Meta_2026_Premium';

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

                    // 1. GET PAGE DATA & TOKEN
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

                    console.log(`📄 Page: ${pageData.page_name}`);

                    // 2. FETCH LEAD DETAILS FROM META
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
                    const leadCity = fields.city || 'India';
                    const leadGender = fields.gender || 'Female';

                    console.log(`👤 Lead: ${leadName} | ${leadPhone} | ${leadCity}`);

                    // ======= VALIDATION 1: TEST LEAD =======
                    if (leadName.includes('test lead') || leadName.includes('dummy data')) {
                        console.log('🧪 TEST LEAD - Skipping');
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

                    // ======= VALIDATION 3: DUPLICATE CHECK =======
                    const { data: existingLead } = await supabase
                        .from('leads')
                        .select('id')
                        .eq('phone', leadPhone)
                        .single();

                    if (existingLead) {
                        console.log(`🔄 DUPLICATE PHONE: ${leadPhone}`);
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

                    // 3. GET ALL ACTIVE USERS
                    const { data: allUsers, error: usersError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('is_active', true);

                    if (usersError || !allUsers || allUsers.length === 0) {
                        console.error('❌ No active users found');
                        await supabase.from('leads').insert({
                            name: leadName,
                            phone: leadPhone,
                            city: leadCity,
                            source: `Meta - ${pageData.page_name}`,
                            status: 'New',
                            is_valid_phone: true,
                            created_at: new Date().toISOString()
                        });
                        continue;
                    }

                    // 4. FILTER ELIGIBLE USERS (Preference Match)
                    const eligibleUsers = allUsers.filter(user => {
                        // Check daily limit
                        const dailyLimit = user.daily_limit || 10;
                        if ((user.leads_today || 0) >= dailyLimit) return false;

                        // Check gender preference
                        if (user.target_gender && user.target_gender !== 'Any') {
                            if (leadGender.toLowerCase() !== user.target_gender.toLowerCase()) {
                                return false;
                            }
                        }

                        // Check state preference
                        if (user.target_state && user.target_state !== 'All India') {
                            const leadCityLower = leadCity.toLowerCase();
                            const targetStateLower = user.target_state.toLowerCase();

                            // Punjab users get all Punjab cities
                            if (targetStateLower.includes('punjab')) {
                                // Allow - Punjab covers most cities
                            } else if (!leadCityLower.includes(targetStateLower)) {
                                return false;
                            }
                        }

                        return true;
                    });

                    if (eligibleUsers.length === 0) {
                        console.log('⚠️ No eligible users');
                        await supabase.from('leads').insert({
                            name: leadName,
                            phone: leadPhone,
                            city: leadCity,
                            source: `Meta - ${pageData.page_name}`,
                            status: 'New',
                            is_valid_phone: true,
                            created_at: new Date().toISOString()
                        });
                        continue;
                    }

                    // 5. PURE EQUAL DISTRIBUTION - MIN LEADS FIRST
                    // Sort by leads_today (ascending) - whoever has least leads gets next
                    // Tie-breaker: user_id for consistency
                    eligibleUsers.sort((a, b) => {
                        const leadsA = a.leads_today || 0;
                        const leadsB = b.leads_today || 0;

                        if (leadsA !== leadsB) {
                            return leadsA - leadsB; // Fewer leads = higher priority
                        }

                        // Tie-breaker: alphabetical by id for consistency
                        return (a.id || '').localeCompare(b.id || '');
                    });

                    const selectedUser = eligibleUsers[0];
                    const newLeadCount = (selectedUser.leads_today || 0) + 1;

                    console.log(`✅ Selected: ${selectedUser.name} | Current: ${selectedUser.leads_today} | After: ${newLeadCount}`);

                    // 6. INSERT LEAD
                    const { error: insertError } = await supabase
                        .from('leads')
                        .insert({
                            name: leadName,
                            phone: leadPhone,
                            city: leadCity,
                            source: `Meta - ${pageData.page_name}`,
                            status: 'Assigned',
                            user_id: selectedUser.id,
                            assigned_at: new Date().toISOString(),
                            is_valid_phone: true,
                            created_at: new Date().toISOString()
                        });

                    if (insertError) {
                        console.error('❌ Insert Error:', insertError.message);
                        continue;
                    }

                    // 7. UPDATE USER COUNT
                    await supabase
                        .from('users')
                        .update({
                            leads_today: newLeadCount,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', selectedUser.id);

                    console.log(`📊 ${selectedUser.name}: ${newLeadCount} leads now`);
                    console.log(`✅ ${leadName} (${leadPhone}) → ${selectedUser.name}`);
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
