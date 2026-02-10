const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env = {};
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim().replace(/^"|"$/g, '');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function checkLeads() {
    // 1. Get raw count of all leads (no filters)
    const { count, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.log('Error:', error.message);
    } else {
        console.log('Total Leads in Table:', count);
    }

    // 2. Try to fetch leads from yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const { data: oldLeads } = await supabase
        .from('leads')
        .select('name, created_at')
        .lt('created_at', yesterday.toISOString())
        .limit(5);

    console.log('Leads from before yesterday:', oldLeads?.length || 0);

    // 3. Check if any lead exists at all
    const { data: anyLead } = await supabase.from('leads').select('id').limit(1);
    console.log('Any Lead Found?', anyLead?.length > 0 ? 'Yes' : 'No');
}

checkLeads();
