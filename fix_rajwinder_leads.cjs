
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function fixRajwinderAssignments() {
    console.log("🛠️ Fixing Rajwinder's Lead Assignments...");
    const today = new Date().toISOString().split('T')[0];

    // 1. Get Rajwinder's team members
    const { data: rajMembers } = await supabase.from('users').select('id, name').eq('team_code', 'TEAMRAJ');
    const rajIds = rajMembers.map(m => m.id);

    // 2. Get the 5 leads from 'rajwinder ad new'
    const { data: leadsToFix } = await supabase
        .from('leads')
        .select('id, name')
        .eq('source', 'rajwinder ad new')
        .gte('created_at', today + 'T00:00:00Z');

    if (!leadsToFix || leadsToFix.length === 0) {
        console.log("No leads to fix.");
        return;
    }

    console.log(`Found ${leadsToFix.length} leads to move to TEAMRAJ.`);

    // 3. Round Robin Move
    let i = 0;
    for (const lead of leadsToFix) {
        const target = rajMembers[i % rajMembers.length];
        console.log(`Moving '${lead.name}' ➔ ${target.name}`);

        await supabase.from('leads').update({
            assigned_to: target.id,
            user_id: target.id,
            status: 'Assigned'
        }).eq('id', lead.id);

        i++;
    }
    console.log("✅ Fixed all Rajwinder leads.");
}

fixRajwinderAssignments();
