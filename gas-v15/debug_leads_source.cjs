
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) process.exit(1);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function inspectLeads() {
    console.log('🕵️ Inspecting Top 10 Pending Leads...');

    const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'New')
        .limit(10);

    if (error) {
        console.error(error);
        return;
    }

    if (leads.length === 0) {
        console.log('✅ Queue Empty (No New leads).');
    } else {
        leads.forEach((l, i) => {
            console.log(`[${i + 1}] ID: ${l.id} | Name: ${l.name} | Source: "${l.source}" | Created: ${l.created_at}`);
        });
    }
}

inspectLeads();
