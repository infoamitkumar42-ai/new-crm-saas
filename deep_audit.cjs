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

async function deepAudit() {
    console.log('--- DEEP DB AUDIT ---');

    // 1. Check leads table count
    const { count: leadCount, error: leadError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

    console.log(`Total Leads in Table: ${leadCount}`);

    // 2. Fetch latest 5 leads without ordering if order fails
    const { data: latestRaw, error: rawError } = await supabase
        .from('leads')
        .select('name, created_at, assigned_to')
        .limit(5);

    console.log('Latest leads (un-ordered):', latestRaw);

    // 3. Check users state
    const { data: topUsers, error: userError } = await supabase
        .from('users')
        .select('name, leads_today, daily_limit, team_code')
        .gt('leads_today', 0)
        .order('leads_today', { ascending: false })
        .limit(10);

    console.log('Top Users by leads_today:', topUsers);
}

deepAudit();
