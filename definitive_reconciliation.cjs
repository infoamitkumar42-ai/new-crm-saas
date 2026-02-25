const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function definitiveReconciliation() {
    const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
    const todayIST = new Intl.DateTimeFormat('en-CA', options).format(new Date());

    console.log(`\n🔍 DEFINITIVE AUDIT FOR TODAY: ${todayIST}`);

    // 1. Fetch ALL leads created today (IST)
    const { data: allLeadsToday } = await supabase
        .from('leads')
        .select('id, source, status, assigned_to, created_at')
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());
    // Note: Better to just filter in JS to be 100% sure about IST

    const { data: allLeads } = await supabase.from('leads').select('id, source, status, assigned_to, created_at');
    const todayLeads = allLeads.filter(l => new Intl.DateTimeFormat('en-CA', options).format(new Date(l.created_at)) === todayIST);

    console.log(`✅ System received ${todayLeads.length} leads in total today.`);

    const himanshuPageName = "TFE 6444 Community (Himanshu)";
    const skillsPageName = "Digital Skills India - By Himanshu Sharma";

    const hLeads = todayLeads.filter(l => l.source === `Meta - ${himanshuPageName}` || l.source === `Meta - ${skillsPageName}`);

    console.log(`\n📊 HIMANSHU PRIMARY PAGES (${himanshuPageName} + Skills India):`);
    console.log(`- Ad Manager says: 419 (approx)`);
    console.log(`- System says    : ${hLeads.length}`);
    console.log(`  └─ Gap: ${419 - hLeads.length} (Could be webhook fails or incomplete leads)`);

    const statusCounts = {};
    const assignedTo = {};
    hLeads.forEach(l => {
        statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
        if (l.assigned_to) assignedTo[l.assigned_to] = (assignedTo[l.assigned_to] || 0) + 1;
    });

    console.log(`\n📄 STATUS BREAKDOWN (For his ${hLeads.length} leads):`);
    Object.entries(statusCounts).forEach(([s, c]) => console.log(`- ${s}: ${c}`));

    // 2. Resolve Users
    const { data: users } = await supabase.from('users').select('id, name, role, team_code');
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });

    console.log(`\n👤 WHO RECEIVED THESE LEADS?`);
    let teamCount = 0;
    let managerCount = 0;

    Object.entries(assignedTo).forEach(([uid, count]) => {
        const u = userMap[uid];
        if (u) {
            if (u.role === 'manager') managerCount += count;
            else teamCount += count;
            console.log(`- ${u.name.padEnd(20)} [${u.team_code || 'No Team'}] : ${count} leads`);
        }
    });

    console.log(`\n📈 TOTAL ASSIGNED TO TEAM MEMBERS: ${teamCount}`);
}

definitiveReconciliation();
