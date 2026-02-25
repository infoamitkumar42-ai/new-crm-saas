const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function investigateDiscrepancy() {
    console.log("🔍 INVESTIGATING LEAD DISCREPANCY FOR HIMANSHU...");

    const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
    const todayIST = new Intl.DateTimeFormat('en-CA', options).format(new Date());

    // 1. Fetch ALL leads created today
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, page_id, status, assigned_to, created_at, source, notes');

    if (error) {
        console.error("Error fetching leads:", error);
        return;
    }

    const todayLeads = leads.filter(l => {
        const leadDateIST = new Intl.DateTimeFormat('en-CA', options).format(new Date(l.created_at));
        return leadDateIST === todayIST;
    });

    console.log(`\n📅 TOTAL LEADS RECEIVED IN SYSTEM TODAY (IST): ${todayLeads.length}`);

    // 2. Map Page IDs to Names for Himanshu
    const { data: pages } = await supabase.from('meta_pages').select('page_id, page_name, team_id');
    const pageMap = {};
    pages.forEach(p => { pageMap[p.page_id] = p; });

    const statsByPage = {};
    const statsByStatus = {};

    todayLeads.forEach(l => {
        const pageInfo = pageMap[l.page_id] || { page_name: 'Unknown/Unlinked', team_id: 'N/A' };
        const key = `${pageInfo.page_name} (${l.page_id})`;

        if (!statsByPage[key]) statsByPage[key] = { count: 0, status: {} };
        statsByPage[key].count++;
        statsByPage[key].status[l.status] = (statsByPage[key].status[l.status] || 0) + 1;

        statsByStatus[l.status] = (statsByStatus[l.status] || 0) + 1;
    });

    console.log("\n📊 LEADS BY PAGE (TODAY IST):");
    Object.entries(statsByPage).sort((a, b) => b[1].count - a[1].count).forEach(([name, data]) => {
        console.log(`- ${name.padEnd(50)}: ${data.count}`);
        Object.entries(data.status).forEach(([s, c]) => {
            console.log(`  └─ ${s.padEnd(15)}: ${c}`);
        });
    });

    console.log("\n🌍 TOTAL STATUS BREAKDOWN (ALL PAGES TODAY IST):");
    Object.entries(statsByStatus).sort((a, b) => b[1] - a[1]).forEach(([s, c]) => {
        console.log(`- ${s.padEnd(15)}: ${c}`);
    });

    // 3. Check for specific Himanshu Team leads that are NOT DELIVERED
    const himanshuTeamLeads = todayLeads.filter(l => {
        const p = pageMap[l.page_id];
        return p && (p.team_id === 'TEAMFIRE' || p.team_id === 'GJ01TEAMFIRE');
    });

    const undeliveredHimanshu = himanshuTeamLeads.filter(l => l.status === 'Queued' || l.status === 'New' || !l.assigned_to);

    console.log(`\n🔥 HIMANSHU TEAM SPECIFIC LEADS:`);
    console.log(`- Total leads from his pages: ${himanshuTeamLeads.length}`);
    console.log(`- Categorized as 'Invalid': ${himanshuTeamLeads.filter(l => l.status === 'Invalid').length}`);
    console.log(`- Categorized as 'Queued': ${himanshuTeamLeads.filter(l => l.status === 'Queued').length}`);
    console.log(`- Successfully Assigned: ${himanshuTeamLeads.filter(l => l.assigned_to).length}`);

    // If there's a huge gap between 419 and todayLeads, maybe some leads are being rejected at the webhook level or not reaching DB.
}

investigateDiscrepancy();
