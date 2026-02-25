const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function deepAudit() {
    const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
    const todayIST = new Intl.DateTimeFormat('en-CA', options).format(new Date());

    console.log(`\n🔍 DEEP AUDIT FOR HIMANSHU PAGES (TODAY: ${todayIST})`);

    // 1. Fetch leads
    const { data: leads } = await supabase.from('leads').select('id, source, status, assigned_to, created_at, notes');
    const todayLeads = leads.filter(l => new Intl.DateTimeFormat('en-CA', options).format(new Date(l.created_at)) === todayIST);

    const targetSources = [
        "Meta - TFE 6444 Community (Himanshu)",
        "Meta - TFE 6444 Cᴏᴍᴍᴜɴɪᴛʏ"
    ];

    const hLeads = todayLeads.filter(l => targetSources.includes(l.source));

    console.log(`✅ Total recorded leads for these 2 pages: ${hLeads.length}`);

    // Status breakdown
    const stats = {};
    hLeads.forEach(l => {
        stats[l.status] = (stats[l.status] || 0) + 1;
    });
    console.log("\n📊 Status Breakdown:");
    Object.entries(stats).forEach(([s, c]) => console.log(`- ${s}: ${c}`));

    // Who got the "Assigned" leads?
    const assignedLeads = hLeads.filter(l => l.status === 'Assigned' || l.status === 'Contacted' || l.status === 'Interested' || l.status === 'Call Back');
    const userIds = [...new Set(assignedLeads.map(l => l.assigned_to).filter(Boolean))];
    const { data: users } = await supabase.from('users').select('id, name, team_code, role');
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });

    const teamStats = {};
    assignedLeads.forEach(l => {
        const u = userMap[l.assigned_to];
        const team = u ? u.team_code : 'Unknown';
        if (!teamStats[team]) teamStats[team] = { count: 0, names: {} };
        teamStats[team].count++;
        if (u) teamStats[team].names[u.name] = (teamStats[team].names[u.name] || 0) + 1;
    });

    console.log("\n👥 Assignment by Team:");
    Object.entries(teamStats).forEach(([team, data]) => {
        console.log(`- Team [${team}]: ${data.count} leads`);
        if (team === 'TEAMFIRE' || team === 'GJ01TEAMFIRE') {
            Object.entries(data.names).sort((a, b) => b[1] - a[1]).forEach(([name, c]) => {
                console.log(`  └─ ${name.padEnd(25)}: ${c}`);
            });
        }
    });

    console.log(`\n💡 Ad Manager shows 419. System shows ${hLeads.length}.`);
    console.log(`   Missing: ${419 - hLeads.length} leads.`);
}

deepAudit();
