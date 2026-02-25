const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("🔍 Fetching Yesterday's Leads (19th Feb 2026) from Himanshu's Pages...\n");

    const yesterdayStart = '2026-02-19T00:00:00.000Z';
    const yesterdayEnd = '2026-02-19T23:59:59.999Z';

    let allLeads = [];
    let hasMore = true;
    let page = 0;
    const pageSize = 1000;

    while (hasMore) {
        // Find leads created strictly between start and end of yesterday
        const { data: leads, error } = await supabase
            .from('leads')
            .select('id, created_at, source, assigned_to, status')
            .ilike('source', '%Himanshu%')
            .gte('created_at', yesterdayStart)
            .lte('created_at', yesterdayEnd)
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error("Error fetching leads:", error.message);
            return;
        }

        allLeads = allLeads.concat(leads);
        hasMore = leads.length === pageSize;
        page++;
    }

    const unassignedLeads = allLeads.filter(l =>
        !l.assigned_to ||
        l.assigned_to.trim() === '' ||
        l.assigned_to.toLowerCase() === 'unassigned' ||
        l.status === 'Unassigned'
    );

    const assignedLeads = allLeads.filter(l =>
        l.assigned_to &&
        l.assigned_to.trim() !== '' &&
        l.assigned_to.toLowerCase() !== 'unassigned' &&
        l.status !== 'Unassigned'
    );

    console.log(`=== YESTERDAY'S LEADS REPORT (19 Feb 2026) ===`);
    console.log(`Total Leads received yesterday: ${allLeads.length}`);
    console.log(`Assigned Leads: ${assignedLeads.length}`);
    console.log(`Unassigned (Orphan) Leads: ${unassignedLeads.length}`);
    console.log(`============================================\n`);

    // Safety verification: Do the 364 date match UTC or Local time?
    // Let's do a loose substring match just in case timezone shift changes the exact number
    console.log("Checking exact dates by string substring '2026-02-19':");
    const { data: allHimanshuText } = await supabase
        .from('leads')
        .select('id, created_at, source, assigned_to, status')
        .ilike('source', '%Himanshu%')
        .like('created_at', '2026-02-19%');

    if (allHimanshuText) {
        const textUnassigned = allHimanshuText.filter(l =>
            !l.assigned_to ||
            l.assigned_to.trim() === '' ||
            l.assigned_to.toLowerCase() === 'unassigned' ||
            l.status === 'Unassigned'
        );
        console.log(`Total Leads exactly matching '2026-02-19T...': ${allHimanshuText.length}`);
        console.log(`Assigned: ${allHimanshuText.length - textUnassigned.length}`);
        console.log(`Unassigned: ${textUnassigned.length}`);
    }

}

main().catch(console.error);
