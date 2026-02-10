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

async function checkLeadsTable() {
    const { count, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error fetching count:', error);
        return;
    }

    console.log(`\n📊 Database Check:`);
    console.log(`   - Total leads in Table: ${count}`);

    const { data: latestLeads, error: leadsError } = await supabase
        .from('leads')
        .select('name, created_at, assigned_to')
        .order('created_at', { ascending: false })
        .limit(5);

    if (leadsError) {
        console.error('Error fetching latest leads:', leadsError);
    } else {
        console.log(`   - Latest 5 leads:`, latestLeads.length > 0 ? latestLeads : 'No leads found');
    }

    // Check Himanshu specifically
    const { data: himanshu, error: hError } = await supabase
        .from('users')
        .select('name, leads_today, daily_limit')
        .eq('email', 'himanshus.numa@gmail.com')
        .single();
    if (himanshu) {
        console.log(`   - Himanshu Quota: ${himanshu.leads_today}/${himanshu.daily_limit}`);
    }
}

checkLeadsTable();
