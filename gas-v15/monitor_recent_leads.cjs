
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Env Vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function monitorRecentLeads() {
    console.log('🕵️ Monitor Recent Assignments (Last 10 mins)...');

    // Get leads assigned in last 10 minutes
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data: leads, error } = await supabase
        .from('leads')
        .select(`
            id, 
            assigned_at, 
            status, 
            user_id,
            users:user_id (name, leads_today, plan_name)
        `)
        .eq('status', 'Assigned')
        .gte('assigned_at', tenMinsAgo)
        .order('assigned_at', { ascending: false });

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    if (leads.length === 0) {
        console.log('✅ No leads assigned in last 10 mins.');
        return;
    }

    console.log(`\n📊 New Assignments: ${leads.length}`);
    leads.forEach(l => {
        const u = l.users || { name: 'Unknown', leads_today: '?' };
        console.log(`⏰ ${new Date(l.assigned_at).toLocaleTimeString()} | ${u.name} (Total: ${u.leads_today}) | Plan: ${u.plan_name}`);
    });

}

monitorRecentLeads();
