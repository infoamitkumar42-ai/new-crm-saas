import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * META WEBHOOK FOR LEADFLOW v16.0 - MULTI-PAGE SUPPORT
 * -----------------------------------------------------
 * Supports multiple Facebook pages with dynamic token lookup
 */

const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || 'LeadFlow_Meta_2026_Premium';

serve(async (req) => {
    const { method } = req;
    console.log(`📡 Incoming Request: ${method} | URL: ${req.url}`);

    // Initialize Supabase client
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. VERIFICATION CHALLENGE (GET)
    if (method === 'GET') {
        const url = new URL(req.url);
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');

        console.log(`🔍 Verification Attempt: Mode=${mode}, Token=${token}`);

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ Webhook Verified Successfully!');
            return new Response(challenge, { status: 200 });
        } else {
            console.error('❌ Webhook Verification Failed. Token mismatch.');
            return new Response('Forbidden', { status: 403 });
        }
    }

    // 2. LEAD RECEPTION (POST)
    if (method === 'POST') {
        try {
            const body = await req.text();
            console.log('📥 Raw Body Received:', body);

            const payload = JSON.parse(body);
            const entries = payload.entry || [];

            for (const entry of entries) {
                const pageId = entry.id; // Facebook Page ID
                console.log(`📄 Page ID from webhook: ${pageId}`);

                for (const change of entry.changes) {
                    if (change.field === 'leadgen') {
                        const leadgenId = change.value.leadgen_id;
                        console.log(`🚀 New Meta Lead Detected! ID: ${leadgenId}`);

                        // 3. LOOKUP ACCESS TOKEN FROM DATABASE
                        const { data: pageData, error: pageError } = await supabase
                            .from('connected_pages')
                            .select('access_token, manager_id, manager_name, page_name')
                            .eq('page_id', pageId)
                            .eq('is_active', true)
                            .single();

                        if (pageError || !pageData) {
                            console.error(`❌ Page not found in database: ${pageId}`);
                            console.error('Error:', pageError?.message);
                            continue;
                        }

                        console.log(`✅ Found page: ${pageData.page_name} | Manager: ${pageData.manager_name}`);
                        const META_ACCESS_TOKEN = pageData.access_token;

                        // 4. FETCH FULL LEAD DETAILS FROM META
                        const metaUrl = `https://graph.facebook.com/v18.0/${leadgenId}?access_token=${META_ACCESS_TOKEN}`;
                        console.log('🌐 Fetching from Meta...');

                        const response = await fetch(metaUrl);
                        const leadData = await response.json();

                        if (leadData.error) {
                            console.error('❌ Meta API Error:', leadData.error.message);
                            continue;
                        }

                        console.log('📄 Meta Data Received:', JSON.stringify(leadData));

                        // Parse field_data
                        const fields: any = {};
                        leadData.field_data?.forEach((f: any) => {
                            fields[f.name] = f.values ? f.values[0] : null;
                        });

                        const phoneRaw = fields.phone_number || '';
                        const cleanPhone = phoneRaw.replace(/\D/g, '').slice(-10);

                        console.log(`💾 Inserting to DB: Name=${fields.full_name}, Phone=${cleanPhone}`);

                        // 5. INSERT INTO SUPABASE WITH PAGE CONTEXT
                        const { data, error } = await supabase
                            .from('leads')
                            .insert({
                                name: fields.full_name || fields.first_name || 'Enquiry',
                                phone: cleanPhone || '0000000000',
                                city: fields.city || 'India',
                                source: `Meta - ${pageData.page_name}`,
                                status: 'New',
                                // Optional: Link to manager if needed
                                // manager_id: pageData.manager_id,
                                created_at: new Date().toISOString()
                            })
                            .select();

                        if (error) {
                            console.error('❌ DB Insertion Error:', error.message);
                        } else {
                            console.log('✅ Lead Saved Successfully!');
                            console.log(`📋 Page: ${pageData.page_name}`);
                            console.log(`👤 Manager: ${pageData.manager_name}`);
                            console.log(`📞 Lead: ${fields.full_name} - ${cleanPhone}`);
                        }
                    }
                }
            }

            return new Response('EVENT_RECEIVED', { status: 200 });
        } catch (error) {
            console.error('❌ Global Processing Error:', error.message);
            return new Response('Internal Server Error', { status: 500 });
        }
    }

    return new Response('Method Not Allowed', { status: 405 });
});
