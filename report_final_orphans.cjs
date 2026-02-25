const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("📊 SYSTEM ORPHAN LEADS & TODAY'S DISTRIBUTION SUMMARY\n");

    // 1. Remaining unassigned leads
    const { data: orphans } = await supabase.from('leads')
        .select('source')
        .is('assigned_to', null);

    console.log(`=== REMAINING UNASSIGNED / ORPHAN LEADS ===`);
    console.log(`Total Unassigned Leads Left: ${orphans ? orphans.length : 0}`);

    if (orphans && orphans.length > 0) {
        const sourceMap = {};
        let missingSource = 0;
        orphans.forEach(l => {
            const src = l.source ? l.source.trim() : 'Unknown/Empty';
            if (!src) missingSource++;
            else sourceMap[src] = (sourceMap[src] || 0) + 1;
        });

        console.log("\nBreakdown by Source:");
        Object.entries(sourceMap)
            .sort((a, b) => b[1] - a[1]) // Sort descending
            .forEach(([src, count]) => {
                console.log(`  - ${src}: ${count} leads`);
            });
        if (missingSource > 0) console.log(`  - Unknown / Empty source: ${missingSource} leads`);
    }

    // 2. Today's Assigned Leads summary
    // Fetch all users and map them
    const { data: users } = await supabase.from('users').select('id, team_code, name');
    const userTeamMap = {};
    users.forEach(u => userTeamMap[u.id] = u.team_code || 'No Team');

    // Get leads assigned since today start
    const startOfToday = '2026-02-21T00:00:00.000+05:30';
    const { data: todayAssigned } = await supabase.from('leads')
        .select('id, assigned_to')
        .gte('assigned_at', startOfToday)
        .not('assigned_to', 'is', null);

    console.log(`\n=== TODAY'S TOTAL LEAD DISTRIBUTIONS (ALL) ===`);
    console.log(`Total Leads Assigned Today System-Wide: ${todayAssigned ? todayAssigned.length : 0}`);

    if (todayAssigned) {
        const teamCount = {};
        todayAssigned.forEach(l => {
            const team = userTeamMap[l.assigned_to] || 'Unknown User/Team';
            teamCount[team] = (teamCount[team] || 0) + 1;
        });

        console.log("\nBreakdown by Team:");
        Object.entries(teamCount)
            .sort((a, b) => b[1] - a[1])
            .forEach(([team, count]) => {
                console.log(`  - ${team}: ${count} leads`);
            });
    }

    console.log("\n(Note: Includes both fresh leads generated today and orphan leads manually reassigned today)");
}

main().catch(console.error);
