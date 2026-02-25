const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    const { data: orphans } = await supabase.from('leads')
        .select('id, created_at, source')
        .is('assigned_to', null);

    if (!orphans || orphans.length === 0) {
        console.log("No unassigned leads found.");
        return;
    }

    const report = {};

    orphans.forEach(l => {
        const d = new Date(l.created_at);
        // Using IST (+5:30)
        const istDate = new Date(d.getTime() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];
        const src = l.source ? l.source.trim() : 'Unknown';

        if (!report[src]) report[src] = {};
        if (!report[src][istDate]) report[src][istDate] = 0;

        report[src][istDate]++;
    });

    console.log(`=== ORPHAN LEADS DATES BY SOURCE (Total: ${orphans.length}) ===\n`);

    Object.entries(report)
        .sort((a, b) => Object.values(b[1]).reduce((sum, v) => sum + v, 0) - Object.values(a[1]).reduce((sum, v) => sum + v, 0))
        .forEach(([src, datesMap]) => {
            const total = Object.values(datesMap).reduce((sum, v) => sum + v, 0);
            console.log(`📌 ${src} (Total: ${total} leads)`);

            Object.entries(datesMap)
                .sort((a, b) => b[0].localeCompare(a[0])) // sort dates descending
                .forEach(([date, count]) => {
                    console.log(`    - ${date}: ${count} leads`);
                });
            console.log("");
        });
}

main().catch(console.error);
