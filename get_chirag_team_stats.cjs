
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const TEAM_CODE = 'GJ01TEAMFIRE';

async function getStats() {
    console.log(`📊 FETCHING STATS FOR TEAM: ${TEAM_CODE}`);
    console.log(`   (Date: 2026-02-06)`);

    // 1. Get Team Members
    const { data: team, error } = await supabase
        .from('users')
        .select('id, name')
        .eq('team_code', TEAM_CODE)
        .eq('is_active', true)
        .order('name');

    if (error) { console.error(error); return; }

    console.log("\nNAME | LEADS TODAY | TOTAL LEADS");
    console.log("-----------------------------------");

    for (const member of team) {
        // Count Today
        // Using >= 2026-02-06 00:00:00
        const { count: todayCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', member.id)
            .gte('created_at', '2026-02-06T00:00:00+05:30'); // IST midnight

        // Count Total
        const { count: totalCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', member.id);

        console.log(`${member.name.padEnd(25)} | ${todayCount.toString().padEnd(11)} | ${totalCount}`);
    }
}

getStats();
