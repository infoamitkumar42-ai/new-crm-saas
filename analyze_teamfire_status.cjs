const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function analyzeStatus() {
    console.log("🕵️ CHECKING STATUS OF RECENT TEAMFIRE LEADS...");

    // Fetch recent 50 leads for TEAMFIRE
    const { data: leads } = await supabase
        .from('leads')
        .select('id, status, source, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

    const teamfireLeads = leads.filter(l => l.source && (l.source.includes('Himanshu') || l.source.includes('TFE')));

    const statusCounts = {};
    teamfireLeads.forEach(l => {
        statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    });

    console.log(`\n📊 TEAMFIRE LEADS STATUS (Last 100 Global -> ${teamfireLeads.length} TEAMFIRE):`);
    console.table(statusCounts);
}

analyzeStatus();
