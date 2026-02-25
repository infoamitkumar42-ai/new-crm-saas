const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("🔍 Checking Today's Leads for 'Meta - Digital Chirag'...\n");

    const TODAY_STR = '2026-02-20';
    const todayStart = `${TODAY_STR}T00:00:00.000Z`;
    const todayEnd = `${TODAY_STR}T23:59:59.999Z`;

    let allLeads = [];
    let hasMore = true;
    let page = 0;

    while (hasMore) {
        const { data: leads, error } = await supabase
            .from('leads')
            .select('id, source, assigned_to, status')
            .ilike('source', '%Chirag%')
            .gte('created_at', todayStart)
            .lte('created_at', todayEnd)
            .range(page * 1000, (page + 1) * 1000 - 1);

        if (error) {
            console.error("Error fetching leads:", error.message);
            return;
        }

        allLeads = allLeads.concat(leads);
        hasMore = leads.length === 1000;
        page++;
    }

    console.log(`Total leads generated today from Chirag's Meta page: ${allLeads.length}`);

    if (allLeads.length > 0) {
        const assignedLeads = allLeads.filter(l =>
            l.assigned_to &&
            l.assigned_to.trim() !== '' &&
            l.assigned_to.toLowerCase() !== 'unassigned' &&
            l.status !== 'Unassigned'
        );
        const unassignedLeads = allLeads.length - assignedLeads.length;

        console.log(`- Automatically Assigned: ${assignedLeads.length}`);
        console.log(`- Currently Unassigned (Orphan): ${unassignedLeads}`);
    } else {
        console.log("No leads have been generated yet today.");
    }
}

main().catch(console.error);
