const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("🔍 Verifying Lead Sources for 19th Feb 2026...\n");

    const yesterdayStart = '2026-02-19T00:00:00.000Z';
    const yesterdayEnd = '2026-02-19T23:59:59.999Z';

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, source, assigned_to')
        .gte('created_at', yesterdayStart)
        .lte('created_at', yesterdayEnd);

    if (error) {
        console.error("Error fetching leads:", error.message);
        return;
    }

    const allSources = {};
    leads.forEach(l => {
        allSources[l.source || 'Unknown'] = (allSources[l.source || 'Unknown'] || 0) + 1;
    });

    console.log(`Total Leads across ENTIRE SYSTEM yesterday: ${leads.length}`);
    console.log("\nBreakdown of ALL sources yesterday:");

    // Convert to array and sort by count descending
    const sortedSources = Object.entries(allSources).sort((a, b) => b[1] - a[1]);

    sortedSources.forEach(([src, count]) => {
        const isHimanshu = src.toLowerCase().includes('himanshu') ? "(✅ Himanshu Page)" : "";
        console.log(`- ${src}: ${count} leads ${isHimanshu}`);
    });

    // Now verify TEAMFIRE assignments
    const { data: teamUsers } = await supabase.from('users').select('id, name, team_code').eq('team_code', 'TEAMFIRE');
    const teamUserIds = teamUsers.map(u => u.id);

    const teamfireAssigned = leads.filter(l => teamUserIds.includes(l.assigned_to));
    console.log(`\nLeads assigned to TEAMFIRE members yesterday: ${teamfireAssigned.length}`);
}

main().catch(console.error);
