const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("🔍 Checking all distinct sources for leads assigned today...");

    const TODAY_STR = '2026-02-20';
    const todayStart = `${TODAY_STR}T00:00:00.000Z`;
    const todayEnd = `${TODAY_STR}T23:59:59.999Z`;

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, source')
        .gte('assigned_at', todayStart)
        .lte('assigned_at', todayEnd)
        .limit(2000);

    if (error) {
        console.error("Error fetching leads:", error.message);
        return;
    }

    const sources = {};
    leads.forEach(l => {
        sources[l.source || 'Unknown'] = (sources[l.source || 'Unknown'] || 0) + 1;
    });

    for (const [src, count] of Object.entries(sources)) {
        console.log(` - "${src}": ${count} leads`);
    }
}

main().catch(console.error);
