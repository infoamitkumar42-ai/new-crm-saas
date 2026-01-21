
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) process.exit(1);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkStatus() {
    console.log('🔍 Checking System Health...');

    // 1. Count New Leads
    const { count: newLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'New');
    console.log(`📦 Leads in Queue (New): ${newLeads}`);

    // 2. Count Active Users
    const { data: users } = await supabase.from('users').select('id, name, leads_today, daily_limit').eq('is_active', true);
    console.log(`👥 Active Users: ${users.length}`);
    users.forEach(u => console.log(`   - ${u.name}: ${u.leads_today}/${u.daily_limit}`));

    // 3. Count Invalid/Assigned
    const { count: assigned } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'Assigned');
    console.log(`✅ Leads Assigned: ${assigned}`);
}

checkStatus();
