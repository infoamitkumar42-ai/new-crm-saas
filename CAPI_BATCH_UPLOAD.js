let PIXEL_ID = '1583951632944842';
let ACCESS_TOKEN = '';
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
import crypto from 'crypto';

function sha256(value) {
    return crypto.createHash('sha256').update((value || '').toLowerCase().trim()).digest('hex');
}

async function fetchLeads(offset, limit) {
    const url = `${SUPABASE_URL}/rest/v1/leads?status=in.(Interested,Closed)&phone=not.is.null&select=phone,name,city,status,created_at&order=created_at.desc&offset=${offset}&limit=${limit}`;
    const res = await fetch(url, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }
    });
    return await res.json();
}

async function sendBatch(events) {
    const res = await fetch(`https://graph.facebook.com/v18.0/${PIXEL_ID}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: events, access_token: ACCESS_TOKEN })
    });
    return await res.json();
}

async function main() {
    console.log('=== CAPI BATCH UPLOAD ===\n');
    if (!SUPABASE_KEY) { console.error('ERROR: Set SUPABASE_SERVICE_ROLE_KEY first'); return; }

    const configRes = await fetch(`${SUPABASE_URL}/rest/v1/pixel_config?is_active=eq.true&select=pixel_id,capi_access_token&limit=1`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const configs = await configRes.json();
    if (!configs || configs.length === 0) { console.error('ERROR: No active pixel config found'); return; }
    PIXEL_ID = configs[0].pixel_id || PIXEL_ID;
    ACCESS_TOKEN = configs[0].capi_access_token;
    console.log(`Dynamically loaded token for PIXEL_ID: ${PIXEL_ID}\n`);

    const countRes = await fetch(`${SUPABASE_URL}/rest/v1/leads?status=in.(Interested,Closed)&phone=not.is.null`, {
        method: 'HEAD',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'count=exact' }
    });
    const range = countRes.headers.get('content-range');
    const totalLeads = range ? parseInt(range.split('/')[1]) : 1;
    console.log(`Total Leads to process roughly: ${totalLeads}\n`);

    let offset = 0, totalSent = 0, totalErrors = 0, globalIndex = 0;
    while (true) {
        const leads = await fetchLeads(offset, 50);
        if (!leads || leads.length === 0) { console.log('\nNo more leads.'); break; }
        const validLeads = leads.filter(l => l.phone && /^[6789]\d{9}$/.test(l.phone.replace(/\D/g, '').slice(-10)));
        const events = validLeads.map(lead => {
            const phone = lead.phone.replace(/\D/g, '').slice(-10);
            const originalEventTime = Math.floor(new Date(lead.created_at).getTime() / 1000);
            const fakeEventTime = Math.floor(Date.now() / 1000) - (7 * 86400) + (globalIndex * Math.floor(7 * 86400 / totalLeads));
            globalIndex++;
            return {
                event_name: lead.status === 'Closed' ? 'Purchase' : 'Lead',
                event_time: fakeEventTime,
                action_source: 'system_generated',
                event_source_url: 'https://leadflowcrm.in',
                event_id: `hist_${phone}_${originalEventTime}`,
                user_data: { ph: [sha256('91' + phone)], fn: [sha256(lead.name || '')], ct: [sha256(lead.city || '')], country: [sha256('in')] },
                custom_data: { event_source: 'crm_historical', lead_status: lead.status, currency: 'INR', value: lead.status === 'Closed' ? 1 : 0 }
            };
        });
        if (events.length === 0) { offset += 50; continue; }
        const result = await sendBatch(events);
        if (result.events_received) { totalSent += result.events_received; console.log(`Batch ${Math.floor(offset/50)+1}: Sent ${result.events_received} | Total: ${totalSent}`); }
        else { totalErrors++; console.error(`Batch ${Math.floor(offset/50)+1}: ERROR`, JSON.stringify(result)); if (totalErrors > 3) break; }
        offset += 50;
        await new Promise(r => setTimeout(r, 2000));
    }
    console.log(`\n=== DONE === Sent: ${totalSent} | Errors: ${totalErrors}`);
}
main().catch(console.error);
