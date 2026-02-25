const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function main() {
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, name')
        .ilike('name', '%Chirag%');

    console.log("Found users named Chirag:", users);

    let allLeads = [];
    for (let u of users) {
        // Fetch all leads for this user order by created_at DESC
        const { data: leads, error: lErr } = await supabase
            .from('leads')
            .select('*')
            .eq('assigned_to', u.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (leads && leads.length > 0) {
            console.log(`User ${u.name} has ${leads.length} leads in the last 50.`);
            allLeads = allLeads.concat(leads.map(l => ({ ...l, chirag_name: u.name })));
        }
    }

    fs.writeFileSync('all_chirag_leads.json', JSON.stringify(allLeads, null, 2));
    if (allLeads.length > 0) {
        console.log("Recent leads dates:");
        allLeads.slice(0, 5).forEach(l => console.log(`${l.created_at} - ${l.name} - assigned_to: ${l.chirag_name}`));
    }
}

main().catch(console.error);
