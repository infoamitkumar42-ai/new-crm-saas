
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function getDetailedTodayAudit() {
    const today = new Date().toISOString().split('T')[0];
    console.log(`📊 Detailed Lead Audit - ${today}\n`);

    const { data: leads } = await supabase
        .from('leads')
        .select('name, source, status, assigned_to, created_at')
        .gte('created_at', today + 'T00:00:00Z')
        .order('created_at', { ascending: false });

    const userIds = leads.map(l => l.assigned_to).filter(id => id);
    const { data: users } = await supabase.from('users').select('id, name, team_code').in('id', userIds);
    const userMap = users?.reduce((acc, u) => ({ ...acc, [u.id]: u }), {}) || {};

    leads.forEach((l, i) => {
        const u = userMap[l.assigned_to];
        console.log(`${i + 1}. [${new Date(l.created_at).toLocaleTimeString()}] Lead: ${l.name}`);
        console.log(`   - 📢 Source: ${l.source}`);
        console.log(`   - 🛡️ Status: ${l.status}`);
        if (u) {
            console.log(`   - 👤 Assigned: ${u.name} (Team: ${u.team_code})`);
        } else {
            console.log(`   - 👤 Assigned: UNASSIGNED`);
        }
        console.log("   ------------------------------------------------");
    });
}

getDetailedTodayAudit();
