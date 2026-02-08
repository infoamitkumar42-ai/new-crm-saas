
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkIsolation() {
    const today = new Date().toISOString().split('T')[0];
    const { data: leads } = await supabase
        .from('leads')
        .select('name, source, assigned_to, created_at')
        .gte('created_at', today + 'T00:00:00Z')
        .order('created_at', { ascending: false });

    const { data: users } = await supabase.from('users').select('id, name, team_code');
    const userMap = users.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});

    console.log("Leads Breakdown by Team Assignment:");
    leads.forEach(l => {
        const u = userMap[l.assigned_to];
        console.log(`[${l.created_at}] Source: ${l.source.padEnd(25)} | Team: ${u ? u.team_code.padEnd(12) : 'NONE'.padEnd(12)} | Assigned: ${u ? u.name : 'N/A'}`);
    });
}

checkIsolation();
