const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function reassignManagerLeads() {
    console.log("🔄 Reassigning Leads from Chirag (Manager) to 0-Lead Members...");

    const managerEmail = "chirag01@gmail.com";
    const teamCode = "GJ01TEAMFIRE";

    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    // 1. Fetch Manager ID
    const { data: manager } = await supabase.from('users').select('id, leads_today').eq('email', managerEmail).single();
    if (!manager) return console.log("Manager not found.");

    // 2. Fetch Leads assigned to manager today
    const { data: leads } = await supabase.from('leads')
        .select('id, name, phone')
        .eq('assigned_to', manager.id)
        .gte('created_at', startOfDay.toISOString());

    console.log(`📦 Found ${leads.length} leads with manager.`);

    if (leads.length === 0) return console.log("No leads to reassign.");

    // 3. Fetch Victims (0 leads today, excludes manager)
    const { data: victims } = await supabase.from('users')
        .select('id, name, email')
        .eq('team_code', teamCode)
        .eq('role', 'member')
        .eq('leads_today', 0)
        .limit(leads.length);

    console.log(`🔍 Found ${victims.length} victims with 0 leads.`);

    let moved = 0;
    for (const lead of leads) {
        if (moved >= victims.length) break;
        const victim = victims[moved];

        console.log(`🔄 Reassigning ${lead.phone} -> ${victim.name}`);

        const { error } = await supabase.from('leads').update({
            assigned_to: victim.id,
            user_id: victim.id,
            notes: `Transfer from Manager account (Fair Distribution)`
        }).eq('id', lead.id);

        if (!error) {
            // Update counts
            await supabase.from('users').update({ leads_today: 1 }).eq('id', victim.id);
            moved++;
        } else {
            console.error(`Error moving ${lead.id}:`, error.message);
        }
    }

    // Reset manager count
    await supabase.from('users').update({ leads_today: 0 }).eq('id', manager.id);

    console.log(`\n🎉 SUCCESS! Moved ${moved} leads.`);
}

reassignManagerLeads();
