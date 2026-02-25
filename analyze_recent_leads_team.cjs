const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function analyze() {
    console.log("📊 ANALYZING RECENT 150 LEADS TEAM DISTRIBUTION...");

    // Fetch recent 150 leads
    const { data: leads } = await supabase
        .from('leads')
        .select('id, assigned_to, source, created_at')
        .order('created_at', { ascending: false })
        .limit(150);

    // Fetch user team map
    const { data: users } = await supabase
        .from('users')
        .select('id, team_code');
    const userTeamMap = {};
    (users || []).forEach(u => userTeamMap[u.id] = u.team_code);

    const breakdown = {};
    const sources = {};

    leads.forEach(l => {
        let team = 'UNASSIGNED';
        if (l.assigned_to && userTeamMap[l.assigned_to]) {
            team = userTeamMap[l.assigned_to];
        } else if (l.source.includes('Himanshu') || l.source.includes('TFE')) {
            team = 'TEAMFIRE'; // Inference
        } else if (l.source.includes('Bhumit') || l.source.includes('Chirag')) {
            team = 'GJ01TEAMFIRE'; // Inference
        }

        breakdown[team] = (breakdown[team] || 0) + 1;

        if (team === 'TEAMFIRE' || team === 'GJ01TEAMFIRE') {
            const src = l.source || 'Unknown';
            if (!sources[team]) sources[team] = {};
            sources[team][src] = (sources[team][src] || 0) + 1;
        }
    });

    console.log("\n--- TEAM CODE COUNT ---");
    console.table(breakdown);

    console.log("\n--- SOURCE BREAKDOWN (Sample) ---");
    for (const team in sources) {
        console.log(`\n[${team}] Sources:`);
        const topSources = Object.entries(sources[team]).sort(([, a], [, b]) => b - a).slice(0, 3);
        topSources.forEach(([src, count]) => console.log(`   - ${src}: ${count}`));
    }
}

analyze();
