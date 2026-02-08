
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkAllLeadsToday() {
    console.log("🔍 Checking which users have leads assigned TODAY...");
    const today = new Date().toISOString().split('T')[0];

    // 1. Get users with leads_today > 0
    const { data: usersWithCount } = await supabase
        .from('users')
        .select('name, email, leads_today, team_code')
        .gt('leads_today', 0);

    console.log("\n--- Users with leads_today > 0 ---");
    console.table(usersWithCount);

    // 2. Count leads in leads table grouping by assigned_to
    const { data: leadsToday } = await supabase
        .from('leads')
        .select('assigned_to, name')
        .gte('created_at', today + 'T00:00:00Z');

    const counts = {};
    leadsToday.forEach(l => {
        counts[l.assigned_to || 'unassigned'] = (counts[l.assigned_to || 'unassigned'] || 0) + 1;
    });

    console.log("\n--- Actual Assignments in 'leads' table today ---");
    for (const [id, count] of Object.entries(counts)) {
        if (id === 'unassigned') {
            console.log(`Unassigned: ${count}`);
        } else {
            const { data: u } = await supabase.from('users').select('name, team_code').eq('id', id).single();
            console.log(`${u?.name} (${u?.team_code}): ${count}`);
        }
    }
}

checkAllLeadsToday();
