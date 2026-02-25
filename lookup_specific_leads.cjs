const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("🔍 Finding specific leads from screenshot...");

    const namesToFind = ['Lethees Varman', 'omkarbudida', 'AYUSH SHARMA', 'Raghav Singh Chauhan'];

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, source, assigned_to, created_at')
        .in('name', namesToFind);

    if (error) {
        console.error("Error fetching leads:", error.message);
        return;
    }

    console.log(`Found ${leads.length} leads matching those names:`);
    leads.forEach(l => {
        console.log(` - ${l.name} | Source: "${l.source}"`);
    });
}

main().catch(console.error);
