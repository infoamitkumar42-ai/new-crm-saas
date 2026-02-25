const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("🔍 Checking Chirag Page Orphan Leads Status...\n");

    const sources = ['Meta - Digital Chirag', 'Meta - Bhumit Godhani Official'];

    for (let src of sources) {
        // Total unassigned
        const { data: orphans } = await supabase.from('leads')
            .select('id, created_at')
            .eq('source', src)
            .is('assigned_to', null)
            .order('created_at', { ascending: true });

        const count = orphans ? orphans.length : 0;
        console.log(`\n=== ${src} ===`);
        console.log(`Unassigned leads: ${count}`);

        if (orphans && orphans.length > 0) {
            // Date breakdown
            const dateWise = {};
            orphans.forEach(l => {
                const d = new Date(l.created_at);
                const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
                const dateStr = ist.toISOString().split('T')[0];
                dateWise[dateStr] = (dateWise[dateStr] || 0) + 1;
            });
            console.log("Date-wise:");
            Object.entries(dateWise).sort().forEach(([d, c]) => console.log(`  ${d}: ${c}`));
        }

        // Total ever from this source
        const { count: totalEver } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('source', src);

        const { count: assigned } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('source', src)
            .not('assigned_to', 'is', null);

        console.log(`Total leads ever from this source: ${totalEver}`);
        console.log(`Assigned: ${assigned} | Unassigned: ${count}`);
    }

    // Also check Rajwinder page orphans
    const rajSources = ['Meta - Rajwinder FB Page 2', 'Meta - rajwinders', 'Meta - rajwinders [TEST]'];
    console.log("\n\n--- Rajwinder Page Orphans ---");
    for (let src of rajSources) {
        const { count } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('source', src)
            .is('assigned_to', null);
        if (count > 0) console.log(`  ${src}: ${count} unassigned`);
    }
}

main().catch(console.error);
