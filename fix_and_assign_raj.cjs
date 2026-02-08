
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function fixRajLeads() {
    console.log("🚀 --- RE-ASSIGNING STUCK RAJWINDER LEADS --- 🚀\n");
    const today = new Date().toISOString().split('T')[0];

    // 1. Get TEAMRAJ active users
    const { data: teamRajUsers } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit')
        .eq('team_code', 'TEAMRAJ')
        .eq('is_active', true);

    if (!teamRajUsers || teamRajUsers.length === 0) {
        console.error("❌ No active users in TEAMRAJ found.");
        return;
    }

    // 2. Get leads from source rajwinder today that are New or Assigned to non-TEAMRAJ
    const { data: allUsers } = await supabase.from('users').select('id, team_code');
    const userToTeam = allUsers.reduce((acc, u) => ({ ...acc, [u.id]: u.team_code }), {});

    const { data: leads } = await supabase
        .from('leads')
        .select('id, name, source, assigned_to, status')
        .ilike('source', '%rajwinder%')
        .gte('created_at', today + 'T00:00:00Z');

    const stuckLeads = leads.filter(l => {
        const team = userToTeam[l.assigned_to];
        return (l.status === 'New' || !l.assigned_to || team !== 'TEAMRAJ');
    });

    console.log(`Found ${stuckLeads.length} leads to re-assign.`);

    // 3. Batch re-assignment (Round Robin)
    let userIndex = 0;
    for (const lead of stuckLeads) {
        const targetUser = teamRajUsers[userIndex];

        const { error: updateError } = await supabase.from('leads').update({
            status: 'Assigned',
            assigned_to: targetUser.id,
            user_id: targetUser.id,
            assigned_at: new Date().toISOString()
        }).eq('id', lead.id);

        if (updateError) {
            console.error(`❌ Error updating lead ${lead.name}:`, updateError.message);
        } else {
            console.log(`✅ Moved Lead: ${lead.name} -> ${targetUser.name}`);
        }

        // Increment local and remote count
        targetUser.leads_today = (targetUser.leads_today || 0) + 1;
        await supabase.rpc('increment_leads_today', { user_id: targetUser.id });

        userIndex = (userIndex + 1) % teamRajUsers.length;
    }

    console.log("\n✅ ALL STUCK LEADS RE-ASSIGNED TO RAJWINDER TEAM!");
}

fixRajLeads();
