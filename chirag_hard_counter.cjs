
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function hardCount() {
    console.log("🕵️‍♂️ CHIRAG TEAM: HARD COUNT FROM LEADS TABLE (Feb 5)...\n");

    const today = new Date().toISOString().split('T')[0];

    // 1. Fetch all leads assigned to Chirag's team members today
    const { data: users } = await supabase.from('users')
        .select('id')
        .eq('team_code', 'GJ01TEAMFIRE');

    const userIds = users.map(u => u.id);

    // 2. Count leads from Leads Table
    const { data: leads } = await supabase.from('leads')
        .select('source, status, assigned_to')
        .in('assigned_to', userIds)
        .gte('created_at', today + 'T00:00:00');

    if (!leads) {
        console.log("No leads assigned found.");
        return;
    }

    let fbLeads = 0;
    let manualLeads = 0;
    let otherLeads = 0;

    leads.forEach(l => {
        const src = (l.source || '').toLowerCase();
        if (src.includes('manual')) manualLeads++;
        else if (src.includes('facebook') || src.includes('chirag') || src.includes('bhumit')) fbLeads++;
        else otherLeads++;
    });

    console.log(`✅ TOTAL LEADS IN CRM FOR CHIRAG TODAY: ${leads.length}`);
    console.log(`   - Facebook Leads:  ${fbLeads}`);
    console.log(`   - Manual Leads:    ${manualLeads}`);
    console.log(`   - Other Sources:   ${otherLeads}`);

    console.log("\n-----------------------------------------");
    console.log(`Ad Manager says: 83 Facebook Leads.`);
    console.log(`CRM has: ${fbLeads} Facebook Leads.`);
    console.log(`GAP: ${83 - fbLeads} Leads.`);
}

hardCount();
