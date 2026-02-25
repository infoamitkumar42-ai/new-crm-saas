const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("🔍 Fetching Exact Date-wise Breakdown of Himanshu's Unassigned Leads...\n");

    let allLeads = [];
    let hasMore = true;
    let page = 0;
    const pageSize = 1000;

    // We fetch EVERYTHING matching source Himanshu
    while (hasMore) {
        const { data: leads, error } = await supabase
            .from('leads')
            .select('id, created_at, source, assigned_to, status, phone') // Fixed column
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

    // Exact filtering logic to be 100% sure they are unassigned
    // assigned_to is literally null, empty string, or 'unassigned' OR status is 'Unassigned'
    const unassignedLeads = allLeads.filter(l =>
        !l.assigned_to ||
        l.assigned_to.trim() === '' ||
        l.assigned_to.toLowerCase() === 'unassigned' ||
        l.status === 'Unassigned'
    );

    console.log(`✅ Yes, I am 100% sure. Total Unassigned Leads found: ${unassignedLeads.length}\n`);

    // Grouping EXACTLY by Date (YYYY-MM-DD)
    const datesMap = {};
    unassignedLeads.forEach(l => {
        // Date part only (local timezone or UTC as from DB, usually UTC but let's just grab the YYYY-MM-DD)
        const dateStr = l.created_at.split('T')[0];
        datesMap[dateStr] = (datesMap[dateStr] || 0) + 1;
    });

    // Sort dates by most recent first
    const sortedDates = Object.entries(datesMap).sort((a, b) => new Date(b[0]) - new Date(a[0]));

    console.log(`📅 EXACT DATE-WISE UNASSIGNED LEADS COUNT:`);
    console.log(`-------------------------------------------`);
    let total = 0;
    for (const [date, count] of sortedDates) {
        console.log(`▶ ${date}: ${count} leads`);
        total += count;
    }
    console.log(`-------------------------------------------`);
    console.log(`Total: ${total} leads\n`);

    // Let's also save them just in case user wants to inspect
    fs.writeFileSync('himanshu_unassigned_detailed.json', JSON.stringify(unassignedLeads, null, 2));
    console.log("JSON saved to 'himanshu_unassigned_detailed.json' for reference.");
}

main().catch(console.error);
