const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("🔍 Scanning ALL leads for messy sources ('Reclaimed', 'Manual Distribution... -')...");

    let allLeads = [];
    let hasMore = true;
    let page = 0;

    // We'll just fetch all leads, or at least recent ones (e.g., this month)
    while (hasMore) {
        const { data: leads, error } = await supabase
            .from('leads')
            .select('id, source')
            .or('source.ilike.%Reclaimed%,source.ilike.%Manual Distribution (Himanshu VIPs) -%')
            .range(page * 1000, (page + 1) * 1000 - 1);

        if (error) {
            console.error("Error fetching leads:", error.message);
            return;
        }

        allLeads = allLeads.concat(leads);
        hasMore = leads.length === 1000;
        page++;
    }

    console.log(`Total messy leads found: ${allLeads.length}`);

    let reclaimedCount = 0;
    let manualCount = 0;

    // Process in batches
    for (let lead of allLeads) {
        if (!lead.source) continue;

        let newSource = null;

        if (lead.source.includes('Reclaimed from')) {
            newSource = 'Meta - Digital Skills India - By Himanshu Sharma';
            reclaimedCount++;
        } else if (lead.source.includes('Manual Distribution (Himanshu VIPs) -')) {
            newSource = 'Manual Distribution (Himanshu VIPs)';
            manualCount++;
        }

        if (newSource) {
            const { error: updErr } = await supabase
                .from('leads')
                .update({ source: newSource })
                .eq('id', lead.id);

            if (updErr) {
                console.error(`Error updating lead ${lead.id}:`, updErr.message);
            }
        }
    }

    console.log(`\n✅ Fixing Complete across entirely database!`);
    console.log(`- Fixed ${reclaimedCount} 'Reclaimed...' sources (Reverted to organic Himanshu meta source)`);
    console.log(`- Fixed ${manualCount} 'Manual Distribution...' sources (Removed the appended dates)`);
}

main().catch(console.error);
