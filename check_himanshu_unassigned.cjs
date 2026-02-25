const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("🔍 Fetching ALL Himanshu's Unassigned Leads...\n");

    let allLeads = [];
    let hasMore = true;
    let page = 0;
    const pageSize = 1000;

    while (hasMore) {
        const { data: leads, error } = await supabase
            .from('leads')
            .select('id, created_at, source, assigned_to, status')
            .ilike('source', '%Himanshu%')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error("Error fetching leads:", error.message);
            return;
        }

        allLeads = allLeads.concat(leads);
        hasMore = leads.length === pageSize;
        page++;
    }

    console.log(`Total Leads found matching Himanshu's pages: ${allLeads.length}`);

    // Filter unassigned leads
    const unassignedLeads = allLeads.filter(l =>
        !l.assigned_to ||
        l.assigned_to.trim() === '' ||
        l.assigned_to === 'unassigned' ||
        l.status === 'Unassigned'
    );

    console.log(`\nTotal UNASSIGNED (Orphan) Leads from Himanshu's pages: ${unassignedLeads.length}\n`);

    // Dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    let todayCount = 0;
    let yesterdayCount = 0;
    let olderCount = 0;

    // Group by Source
    const sources = {};

    unassignedLeads.forEach(l => {
        const leadDate = new Date(l.created_at);

        if (leadDate >= today) {
            todayCount++;
        } else if (leadDate >= yesterday && leadDate < today) {
            yesterdayCount++;
        } else {
            olderCount++;
        }

        sources[l.source] = (sources[l.source] || 0) + 1;
    });

    console.log(`=== ORPHAN LEADS BREAKDOWN ===`);
    console.log(`📍 TODAY (20 Feb 2026): ${todayCount}`);
    console.log(`📍 YESTERDAY (19 Feb 2026): ${yesterdayCount}`);
    console.log(`📍 OLDER (Purani): ${olderCount}`);
    console.log(`==============================\n`);

    if (unassignedLeads.length > 0) {
        console.log("Sources of these Orphan Leads:");
        for (const [src, count] of Object.entries(sources)) {
            console.log(` - ${src}: ${count}`);
        }
    } else {
        console.log("✅ Badhiya! Koi bhi lead orphan (unassigned) nahi mili Himanshu ki pages se.");
    }
}

main().catch(console.error);
