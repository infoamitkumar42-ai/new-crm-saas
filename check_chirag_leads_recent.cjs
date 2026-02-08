
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkChiragTeamLeads() {
    console.log("🕵️ CHECKING CHIRAG TEAM LEADS (Since Yesterday)...");

    // 1. Get All Chirag Team User IDs
    const { data: team } = await supabase.from('users').select('id, name').eq('team_code', 'GJ01TEAMFIRE');

    if (!team || team.length === 0) {
        console.log("No members found in GJ01TEAMFIRE team code.");
        return;
    }

    const userIds = team.map(u => u.id);
    console.log(`Checking leads for ${userIds.length} members...`);

    // 2. Check Leads in Last 24 Hrs
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, assigned_to, source, created_at')
        .in('assigned_to', userIds)
        .gt('created_at', yesterday);

    if (error) { console.error("Error:", error); return; }

    if (leads.length === 0) {
        console.log("\n✅ ZERO LEADS found for Chirag's Team in last 24 hours.");
        console.log("   -> System has NOT distributed anything automatically.");
        console.log("   -> If Ashwin says he got a lead, he might be mistaken or looking at old data.");
    } else {
        console.log(`\n⚠️ FOUND ${leads.length} LEADS distributed!`);
        console.table(leads.map(l => ({
            Name: l.name,
            Source: l.source,
            AssignedTo: team.find(u => u.id === l.assigned_to)?.name,
            Time: new Date(l.created_at).toLocaleString('en-IN')
        })));
    }
}

checkChiragTeamLeads();
