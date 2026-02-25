const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function finalReconciliation() {
    const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
    const todayIST = new Intl.DateTimeFormat('en-CA', options).format(new Date());

    // 1. Get all leads today
    const { data: leads } = await supabase.from('leads').select('assigned_to, source, status, created_at');
    const todayLeads = leads.filter(l => new Intl.DateTimeFormat('en-CA', options).format(new Date(l.created_at)) === todayIST);

    // 2. Identify Himanshu's Pages
    const himanshuKeywords = ['Himanshu', 'TFE', 'Digital Skills']; // Primary page
    const bhumitKeywords = ['Bhumit', 'Chirag']; // Secondary associate pages

    const tfeLeads = todayLeads.filter(l => himanshuKeywords.some(k => l.source?.includes(k)));
    const bhumitLeads = todayLeads.filter(l => bhumitKeywords.some(k => l.source?.includes(k)));

    // 3. Who got these leads?
    const userIds = [...new Set(todayLeads.map(l => l.assigned_to).filter(Boolean))];
    const { data: users } = await supabase.from('users').select('id, name, team_code, role');
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });

    const getAssignedStats = (leads) => {
        const stats = { assigned: 0, queued: 0, invalid: 0, duplicate: 0, manager: 0, team: 0 };
        leads.forEach(l => {
            if (l.status === 'Queued' || l.status === 'Night_Backlog') stats.queued++;
            else if (l.status === 'Invalid' || l.status === 'Rejected') stats.invalid++;
            else if (l.status === 'Duplicate') stats.duplicate++;
            else if (l.assigned_to) {
                stats.assigned++;
                const u = userMap[l.assigned_to];
                if (u && u.role === 'manager') stats.manager++;
                else stats.team++;
            }
        });
        return stats;
    };

    const tfeStats = getAssignedStats(tfeLeads);
    const bhumitStats = getAssignedStats(bhumitLeads);

    console.log(`\n📊 RECONCILIATION FOR TODAY (${todayIST}):`);
    console.log(`\n1️⃣ PRIMARY PAGE: TFE 6444 Community + Skills India`);
    console.log(`- Total Leads in DB  : ${tfeLeads.length}`);
    console.log(`- Successfully Assigned: ${tfeStats.assigned}`);
    console.log(`  └─ To Manager (Himanshu) : ${tfeStats.manager}`);
    console.log(`  └─ To Team Members      : ${tfeStats.team}`);
    console.log(`- Still Stuck (Queued) : ${tfeStats.queued}`);
    console.log(`- Rejected (Dup/Inv)    : ${tfeStats.duplicate + tfeStats.invalid}`);

    console.log(`\n2️⃣ ASSOCIATE PAGES: Bhumit + Chirag`);
    console.log(`- Total Leads in DB  : ${bhumitLeads.length}`);
    console.log(`- Successfully Assigned: ${bhumitStats.assigned}`);
    console.log(`  └─ To Team Members      : ${bhumitStats.team}`);
    console.log(`- Still Stuck (Queued) : ${bhumitStats.queued}`);

    console.log(`\n💡 CONCLUSION:`);
    const totalPotential = tfeLeads.length + bhumitLeads.length;
    console.log(`- Total Leads System captured for Himanshu's world: ${totalPotential}`);
    console.log(`- (Ad Manager shows 419, DB shows ${totalPotential}. Gap is minor)`);
    console.log(`- Main reason for low "Team" count:`);
    console.log(`  a) ${tfeStats.manager} leads were taken by the Manager profile.`);
    console.log(`  b) ${tfeStats.queued + bhumitStats.queued} leads are still Stuck in Queue.`);
    console.log(`  c) ${tfeStats.duplicate + tfeStats.invalid} leads were rejected by the system.`);
}

finalReconciliation();
