import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * LEADFLOW WEBHOOK v17.0 - COMPLETE AUTO-DISTRIBUTION
 * ====================================================
 * • Receives leads from Facebook
 * • Auto-finds eligible user (round-robin)
 * • Assigns instantly
 * • Sends email notification
 * • NO GAS NEEDED!
 */

const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || 'LeadFlow_Meta_2026_Premium';

// Email configuration (using Supabase Edge Function)
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';

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
            console.log('📥 Webhook Received:', JSON.stringify(payload));

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
                    const leadGender = fields.gender || 'unknown';

                    console.log(`👤 Lead: ${leadName} | ${leadPhone} | ${leadCity}`);

                    // 2.5 SKIP TEST LEADS
                    if (leadName.includes('test lead') || leadName.includes('dummy data')) {
                        console.log('🧪 TEST LEAD DETECTED - Skipping distribution');
                        // Save test lead separately without assignment
                        await supabase.from('leads').insert({
                            name: `[TEST] ${leadName}`,
                            phone: leadPhone || 'TEST',
                            city: leadCity,
                            source: `Meta - ${pageData.page_name} [TEST]`,
                            status: 'Test',
                            created_at: new Date().toISOString()
                        });
                        console.log('🧪 Test lead saved (not assigned to any user)');
                        continue;
                    }

                    // 3. FIND ELIGIBLE USER (Round-Robin)
                    // Get all active users who:
                    // - Are active
                    // - Have not reached daily limit
                    // - Match lead's location/gender (if filter set)

                    let userQuery = supabase
                        .from('users')
                        .select('*')
                        .eq('is_active', true)
                        .lt('leads_today', supabase.rpc('get_user_daily_limit')); // Less than their limit

                    // For now, get all active users and filter in code
                    const { data: allUsers, error: usersError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('is_active', true);

                    if (usersError || !allUsers || allUsers.length === 0) {
                        console.error('❌ No active users found');

                        // Save as unassigned
                        await supabase.from('leads').insert({
                            name: leadName,
                            phone: leadPhone,
                            city: leadCity,
                            source: `Meta - ${pageData.page_name}`,
                            status: 'New',
                            created_at: new Date().toISOString()
                        });
                        continue;
                    }

                    // Filter eligible users
                    const eligibleUsers = allUsers.filter(user => {
                        // Check daily limit
                        const dailyLimit = user.daily_limit || 10;
                        if ((user.leads_today || 0) >= dailyLimit) return false;

                        // Check state filter
                        if (user.target_state && user.target_state !== 'All India') {
                            // Simple check - can be enhanced
                            if (!leadCity.toLowerCase().includes(user.target_state.toLowerCase())) {
                                // Skip strict state filtering for now
                            }
                        }

                        // Check gender filter
                        if (user.target_gender && user.target_gender !== 'Any') {
                            if (leadGender !== 'unknown' &&
                                leadGender.toLowerCase() !== user.target_gender.toLowerCase()) {
                                return false;
                            }
                        }

                        return true;
                    });

                    if (eligibleUsers.length === 0) {
                        console.log('⚠️ No eligible users, saving as New');
                        await supabase.from('leads').insert({
                            name: leadName,
                            phone: leadPhone,
                            city: leadCity,
                            source: `Meta - ${pageData.page_name}`,
                            status: 'New',
                            created_at: new Date().toISOString()
                        });
                        continue;
                    }

                    // Sort by leads_today (ascending) - min leads first
                    eligibleUsers.sort((a, b) => {
                        const leadsA = a.leads_today || 0;
                        const leadsB = b.leads_today || 0;
                        if (leadsA !== leadsB) return leadsA - leadsB;
                        // Tie-breaker: user_id for consistency
                        return (a.id || '').localeCompare(b.id || '');
                    });

                    const selectedUser = eligibleUsers[0];
                    console.log(`✅ Selected User: ${selectedUser.name} (${selectedUser.email})`);

                    // 4. INSERT LEAD WITH ASSIGNMENT
                    const { data: insertedLead, error: insertError } = await supabase
                        .from('leads')
                        .insert({
                            name: leadName,
                            phone: leadPhone,
                            city: leadCity,
                            source: `Meta - ${pageData.page_name}`,
                            status: 'Assigned',
                            user_id: selectedUser.id,
                            assigned_at: new Date().toISOString(),
                            created_at: new Date().toISOString()
                        })
                        .select()
                        .single();

                    if (insertError) {
                        console.error('❌ Insert Error:', insertError.message);
                        continue;
                    }

                    // 5. UPDATE USER'S LEAD COUNT
                    await supabase
                        .from('users')
                        .update({
                            leads_today: (selectedUser.leads_today || 0) + 1,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', selectedUser.id);

                    console.log(`📊 Updated ${selectedUser.name} leads_today: ${(selectedUser.leads_today || 0) + 1}`);

                    // 6. SEND EMAIL NOTIFICATION
                    if (selectedUser.email && RESEND_API_KEY) {
                        try {
                            await fetch('https://api.resend.com/emails', {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    from: 'LeadFlow CRM <leads@yourdomain.com>',
                                    to: selectedUser.email,
                                    subject: `🔥 New Lead: ${leadName}`,
                                    html: `
                                        <h2>New Lead Assigned!</h2>
                                        <p><strong>Name:</strong> ${leadName}</p>
                                        <p><strong>Phone:</strong> ${leadPhone}</p>
                                        <p><strong>City:</strong> ${leadCity}</p>
                                        <p><strong>Source:</strong> Meta - ${pageData.page_name}</p>
                                        <br>
                                        <p>Login to your dashboard to contact this lead!</p>
                                    `
                                })
                            });
                            console.log(`📧 Email sent to ${selectedUser.email}`);
                        } catch (emailError) {
                            console.log('⚠️ Email failed, but lead saved');
                        }
                    }

                    console.log(`✅ Lead ${leadName} assigned to ${selectedUser.name}`);
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
