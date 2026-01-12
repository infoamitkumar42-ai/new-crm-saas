import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * META WEBHOOK FOR LEADFLOW v15.0
 * -------------------------------------------
 */

const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || 'LeadFlow_Meta_2026_Premium';
const META_ACCESS_TOKEN = Deno.env.get('META_ACCESS_TOKEN');

serve(async (req) => {
    const { method } = req;
    console.log(`📡 Incoming Request: ${method} | URL: ${req.url}`);

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
            const supabase = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            );

            const entries = payload.entry || [];

            for (const entry of entries) {
                for (const change of entry.changes) {
                    if (change.field === 'leadgen') {
                        const leadgenId = change.value.leadgen_id;
                        console.log(`🚀 New Meta Lead Detected! ID: ${leadgenId}`);

                        // 3. FETCH FULL LEAD DETAILS
                        const metaUrl = `https://graph.facebook.com/v18.0/${leadgenId}?access_token=${META_ACCESS_TOKEN}`;
                        console.log('🌐 Fetching from Meta:', metaUrl.replace(META_ACCESS_TOKEN || '', 'TOKEN_HIDDEN'));

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

                        // 4. INSERT INTO SUPABASE
                        const { data, error } = await supabase
                            .from('leads')
                            .insert({
                                name: fields.full_name || fields.first_name || 'Enquiry',
                                phone: cleanPhone || '0000000000',
                                city: fields.city || 'India',
                                source: 'Meta Webhook',
                                status: 'New',
                                created_at: new Date().toISOString()
                            })
                            .select();

                        if (error) {
                            console.error('❌ DB Insertion Error:', error.message);
                        } else {
                            console.log('✅ Lead Saved Successfully! Row:', JSON.stringify(data));
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
