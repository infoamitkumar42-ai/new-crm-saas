const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    const { data: orphans } = await supabase.from('leads')
        .select('id, source, created_at')
        .is('assigned_to', null)
        .ilike('source', '%chirag%'); // Case-insensitive match for "chirag" in source

    if (!orphans || orphans.length === 0) {
        console.log("No orphan leads found for Chirag's pages.");
        return;
    }

    console.log(`Found ${orphans.length} remaining orphan leads for Chirag's pages.\n`);

    const sourceMap = {};
    const dateMap = {};

    orphans.forEach(l => {
        const src = l.source ? l.source.trim() : 'Unknown';
        sourceMap[src] = (sourceMap[src] || 0) + 1;

        const date = new Date(l.created_at).toISOString().split('T')[0];
        if (!dateMap[src]) dateMap[src] = {};
        dateMap[src][date] = (dateMap[src][date] || 0) + 1;
    });

    Object.entries(sourceMap).sort((a, b) => b[1] - a[1]).forEach(([src, count]) => {
        console.log(`📌 Source: ${src} (Total: ${count} leads)`);
        Object.entries(dateMap[src]).forEach(([date, dcount]) => {
            console.log(`    - ${date}: ${dcount} leads`);
        });
        console.log("");
    });
}

main().catch(console.error);
