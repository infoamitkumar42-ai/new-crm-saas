
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * LEADFLOW WEBHOOK v26 - EMERGENCY STOP (PAUSED)
 * ==============================================
 * Status: CAPTURE ONLY. NO DISTRIBUTION.
 */

const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || 'LeadFlow_Meta_2026_Premium';

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
            console.log('🛑 Webhook PAUSED - Saving Leads as NEW');

            for (const entry of payload.entry || []) {
                const pageId = entry.id;
                for (const change of entry.changes) {
                    if (change.field !== 'leadgen') continue;

                    const leadgenId = change.value.leadgen_id;
                    const { data: pageData } = await supabase.from('connected_pages').select('*').eq('page_id', pageId).single();
                    if (!pageData) continue;

                    const metaRes = await fetch(`https://graph.facebook.com/v18.0/${leadgenId}?access_token=${pageData.access_token}`);
                    const leadData = await metaRes.json();

                    // Simple Capture Logic
                    const fields: Record<string, string> = {};
                    leadData.field_data?.forEach((f: any) => fields[f.name] = f.values?.[0] || '');

                    const name = fields.full_name || 'Enquiry';
                    const phone = (fields.phone_number || '').replace(/\D/g, '').slice(-10);
                    const city = fields.city || '';

                    // INSERT AS NEW (NO ASSIGNMENT)
                    await supabase.from('leads').insert({
                        name, phone, city,
                        source: `Meta - ${pageData.page_name}`,
                        status: 'New', // <--- JUST NEW, NO ASSIGNMENT
                        is_valid_phone: true,
                        created_at: new Date().toISOString()
                    });

                    console.log(`✅ Saved Lead: ${name} (Status: New)`);
                }
            }
            return new Response('Saved', { status: 200 });
        } catch (e) {
            return new Response(e.message, { status: 500 });
        }
    }
    return new Response('Method Not Allowed', { status: 405 });
});
