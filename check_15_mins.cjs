
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkLeadsLast15Mins() {
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    console.log(`🔍 Checking leads created since: ${fifteenMinsAgo} (last 15 minutes)`);

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, source, status, assigned_to, created_at')
        .gt('created_at', fifteenMinsAgo)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("❌ Error fetching leads:", error);
        return;
    }

    if (!leads || leads.length === 0) {
        console.log("📭 No leads found in the last 15 minutes.");
        // Let's also check the last 30 minutes just in case
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const { data: leads30 } = await supabase.from('leads').select('name, created_at').gt('created_at', thirtyMinsAgo);
        console.log(`(Last 30 mins count: ${leads30?.length || 0})`);
        return;
    }

    console.log(`Total Leads found in last 15 mins: ${leads.length}\n`);

    const userIds = [...new Set(leads.map(l => l.assigned_to).filter(id => id))];
    const { data: users } = await supabase.from('users').select('id, name, team_code').in('id', userIds);
    const userMap = users?.reduce((acc, u) => ({ ...acc, [u.id]: u }), {}) || {};

    leads.forEach((l, i) => {
        const u = userMap[l.assigned_to];
        console.log(`${i + 1}. [${new Date(l.created_at).toLocaleTimeString()}] Lead: ${l.name}`);
        console.log(`   - 📢 Source: ${l.source}`);
        console.log(`   - 👤 Assigned To: ${u ? u.name + " (" + u.team_code + ")" : "UNASSIGNED"}`);
        console.log("   ------------------------------------------------");
    });
}

checkLeadsLast15Mins();
