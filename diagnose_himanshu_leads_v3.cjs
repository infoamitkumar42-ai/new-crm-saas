const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function investigateDiscrepancy() {
    console.log("🔍 INVESTIGATING LEAD DISCREPANCY FOR HIMANSHU (FEB 11)...");

    const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
    const todayIST = new Intl.DateTimeFormat('en-CA', options).format(new Date());

    // 1. Fetch leads created today (or since late yesterday to be safe with IST)
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, source, status, assigned_to, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching leads:", error);
        return;
    }

    const todayLeads = leads.filter(l => {
        const leadDateIST = new Intl.DateTimeFormat('en-CA', options).format(new Date(l.created_at));
        return leadDateIST === todayIST;
    });

    console.log(`\n📅 TOTAL LEADS RECORDED IN DB TODAY (IST): ${todayLeads.length}`);

    const statsBySource = {};
    const statsByStatus = {};

    todayLeads.forEach(l => {
        const source = l.source || 'Unknown';
        if (!statsBySource[source]) statsBySource[source] = { count: 0, status: {} };
        statsBySource[source].count++;
        statsBySource[source].status[l.status] = (statsBySource[source].status[l.status] || 0) + 1;

        statsByStatus[l.status] = (statsByStatus[l.status] || 0) + 1;
    });

    console.log("\n📊 LEADS BY SOURCE (TODAY IST):");
    Object.entries(statsBySource).sort((a, b) => b[1].count - a[1].count).forEach(([source, data]) => {
        console.log(`- ${source.padEnd(50)}: ${data.count}`);
        Object.entries(data.status).forEach(([s, c]) => {
            console.log(`  └─ ${s.padEnd(15)}: ${c}`);
        });
    });

    console.log("\n🌍 TOTAL STATUS BREAKDOWN (TODAY IST):");
    Object.entries(statsByStatus).sort((a, b) => b[1] - a[1]).forEach(([s, c]) => {
        console.log(`- ${s.padEnd(15)}: ${c}`);
    });

    // Himanshu Pages (He mentioned his page specifically)
    const himanshuKeywords = ['Himanshu', 'TFE', 'Digital Skills', 'Bhumit'];
    const himanshuLeads = todayLeads.filter(l => himanshuKeywords.some(k => l.source?.includes(k)));

    console.log(`\n🔥 HIMANSHU TEAM SUMMARY (Approx based on source name):`);
    console.log(`- System recorded leads: ${himanshuLeads.length}`);
    console.log(`- Assigned to users   : ${himanshuLeads.filter(l => l.assigned_to).length}`);
    console.log(`- Queued (Pending)    : ${himanshuLeads.filter(l => l.status === 'Queued').length}`);
    console.log(`- Invalid/Rejected    : ${himanshuLeads.filter(l => l.status === 'Invalid').length}`);

    if (himanshuLeads.length < 300 && todayLeads.length < 350) {
        console.log("\n⚠️ WARNING: System total leads are significantly less than Ad Manager's 419.");
        console.log("Possible reasons:");
        console.log("1. Webhook errors (leads not being inserted into DB).");
        console.log("2. Duplication check in webhook rejected them before DB insertion.");
        console.log("3. Ad Manager count includes 'Draft' or 'Incomplete' leads that didn't fire webhook.");
    }
}

investigateDiscrepancy();
