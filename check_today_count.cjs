const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("🔍 Fetching today's (Feb 21) leads count...");

    // Get today's start and end timestamps based on local time
    const today = new Date();
    // Assuming IST, create bounds for today
    const startStr = '2026-02-21T00:00:00.000+05:30';
    const endStr = '2026-02-21T23:59:59.999+05:30';

    // Fetch using a more robust pagination or just count
    const { count, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startStr)
        .lte('created_at', endStr);

    if (error) {
        console.error("Error fetching leads count:", error.message);
        return;
    }

    console.log(`✅ Total Leads Generated Today (Feb 21): ${count}`);

    // Let's also break it down by source
    const { data: leads, error: fetchErr } = await supabase
        .from('leads')
        .select('source')
        .gte('created_at', startStr)
        .lte('created_at', endStr);

    if (fetchErr) {
        console.error("Error fetching lead sources:", fetchErr.message);
        return;
    }

    const sources = {};
    leads.forEach(l => {
        const src = l.source || 'Unknown';
        sources[src] = (sources[src] || 0) + 1;
    });

    console.log(`\nBreakdown by Source:`);
    for (const [src, c] of Object.entries(sources)) {
        console.log(` - ${src}: ${c}`);
    }
}

main().catch(console.error);
