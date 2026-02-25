const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function main() {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 3);

    const { data: leads, error: lErr } = await supabase
        .from('leads')
        .select('id, name, assigned_to, user_id, status, source, created_at, assigned_at')
        .gte('created_at', twoDaysAgo.toISOString());

    if (lErr) {
        console.error(lErr);
        return;
    }

    console.log(`Total leads in last 3 days: ${leads.length}`);

    const counts = {};
    leads.forEach(l => {
        let key = l.assigned_to || 'unassigned';
        counts[key] = (counts[key] || 0) + 1;
    });

    const { data: users } = await supabase.from('users').select('id, name');
    const userMap = {};
    if (users) {
        users.forEach(u => userMap[u.id] = u.name);
    }

    for (let k in counts) {
        let name = userMap[k] || k;
        console.log(`${name} (${k}): ${counts[k]} leads`);
    }

    // check if there are any exactly 17 leads anywhere
    console.log("\nUsers with ~17 leads:");
    for (let k in counts) {
        if (counts[k] >= 15 && counts[k] <= 20) {
            let name = userMap[k] || k;
            console.log(`- ${name} has ${counts[k]} leads`);

            // what are these leads?
            const userLeads = leads.filter(l => (l.assigned_to || 'unassigned') === k);
            console.log(`  Sources:`, [...new Set(userLeads.map(l => l.source))]);
            console.log(`  Statuses:`, [...new Set(userLeads.map(l => l.status))]);
        }
    }
}

main().catch(console.error);
