
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function fixHimanshuStuckLeads() {
    console.log("🚀 --- RE-ASSIGNING STUCK HIMANSHU LEADS --- 🚀\n");
    const today = new Date().toISOString().split('T')[0];

    // 1. Get TEAMFIRE active/online users
    const { data: teamFireUsers } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true)
        .eq('is_online', true);

    if (!teamFireUsers || teamFireUsers.length === 0) {
        console.error("❌ No active/online users in TEAMFIRE found.");
        return;
    }

    // 2. Get leads from Himanshu's CBO sources today that are 'New'
    const { data: leads } = await supabase
        .from('leads')
        .select('id, name, source, status')
        .ilike('source', '%CBO%')
        .eq('status', 'New')
        .gte('created_at', today + 'T00:00:00Z');

    if (!leads || leads.length === 0) {
        console.log("✅ No stuck Himanshu leads found.");
        return;
    }

    console.log(`Found ${leads.length} leads stuck in 'New'.`);

    // 3. Batch re-assignment (Round Robin among users with capacity)
    let userIndex = 0;
    let distributedCount = 0;

    for (const lead of leads) {
        // Find a user with capacity
        let attempts = 0;
        let targetUser = null;

        while (attempts < teamFireUsers.length) {
            let potential = teamFireUsers[userIndex];
            if ((potential.leads_today || 0) < (potential.daily_limit || 0)) {
                targetUser = potential;
                break;
            }
            userIndex = (userIndex + 1) % teamFireUsers.length;
            attempts++;
        }

        if (!targetUser) {
            console.log("🛑 ALL TEAMFIRE USERS ARE FULL! Cannot assign more leads.");
            break;
        }

        console.log(`Assigning Lead: ${lead.name} -> ${targetUser.name} (${targetUser.leads_today + 1}/${targetUser.daily_limit})`);

        await supabase.from('leads').update({
            status: 'Assigned',
            assigned_to: targetUser.id,
            user_id: targetUser.id,
            assigned_at: new Date().toISOString()
        }).eq('id', lead.id);

        // Increment counts
        targetUser.leads_today = (targetUser.leads_today || 0) + 1;
        await supabase.rpc('increment_leads_today', { user_id: targetUser.id });

        userIndex = (userIndex + 1) % teamFireUsers.length;
        distributedCount++;
    }

    console.log(`\n✅ ${distributedCount} STUCK LEADS ASSIGNED TO HIMANSHU TEAM!`);
}

fixHimanshuStuckLeads();
