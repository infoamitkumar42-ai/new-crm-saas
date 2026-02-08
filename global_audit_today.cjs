
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function globalAudit() {
    console.log("🌍 GLOBAL AUDIT: Every Lead Created Today (Feb 5)...\n");

    const today = new Date().toISOString().split('T')[0];

    // Fetch ALL leads created today
    const { data: leads, error } = await supabase.from('leads')
        .select(`
            id, 
            source, 
            status, 
            assigned_to,
            created_at,
            users (
                name,
                team_code
            )
        `)
        .gte('created_at', today + 'T00:00:00')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching leads:", error);
        return;
    }

    console.log(`📊 TOTAL LEADS ACROSS ALL TEAMS TODAY: ${leads.length}`);

    const teamBreakdown = {};
    const sourceBreakdown = {};

    leads.forEach(l => {
        const team = l.users?.team_code || 'UNASSIGNED';
        teamBreakdown[team] = (teamBreakdown[team] || 0) + 1;

        const src = l.source || 'UNKNOWN';
        sourceBreakdown[src] = (sourceBreakdown[src] || 0) + 1;
    });

    console.log("\n🏢 Team-wise Assignment:");
    Object.entries(teamBreakdown).forEach(([t, c]) => console.log(`- ${t.padEnd(15)}: ${c} Leads`));

    console.log("\nsource-wise Breakdown:");
    Object.entries(sourceBreakdown).forEach(([s, c]) => console.log(`- ${s.padEnd(25)}: ${c} Leads`));

    console.log("\n-----------------------------------------");
    console.log("Checking for 'Digital Chirag' specific sources in Global List...");
    const chiragGlobal = leads.filter(l =>
        (l.source || '').toLowerCase().includes('chirag') ||
        (l.source || '').toLowerCase().includes('bhumit')
    );
    console.log(`Found ${chiragGlobal.length} leads matching Chirag/Bhumit globally.`);
}

globalAudit();
