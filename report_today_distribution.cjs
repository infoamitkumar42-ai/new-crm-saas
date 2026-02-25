const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("📊 Compiling Today's Manual Distribution Report for TEAMFIRE...\n");

    const TODAY_STR = '2026-02-20';
    const todayStart = `${TODAY_STR}T00:00:00.000Z`;
    const todayEnd = `${TODAY_STR}T23:59:59.999Z`;

    // 1. Fetch all ACTIVE users in TEAMFIRE
    const { data: teamUsers, error: tErr } = await supabase
        .from('users')
        .select('id, name, email, plan_name, leads_today')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true)
        .order('name', { ascending: true });

    if (tErr) {
        console.error("Error fetching team users:", tErr.message);
        return;
    }

    // Include sharmahimanshu9797@gmail.com explicitly just in case he is in a different team or admin
    const { data: specUser } = await supabase
        .from('users')
        .select('id, name, email, plan_name, leads_today')
        .eq('email', 'sharmahimanshu9797@gmail.com');

    if (specUser && specUser.length > 0 && !teamUsers.find(u => u.id === specUser[0].id)) {
        teamUsers.push(specUser[0]);
    }

    const teamUserIds = teamUsers.map(u => u.id);

    // 2. Fetch all leads assigned today to these users
    let allAssignedLeads = [];
    let hasMore = true;
    let page = 0;

    while (hasMore) {
        const { data: leads, error } = await supabase
            .from('leads')
            .select('id, source, assigned_to')
            .in('assigned_to', teamUserIds)
            .gte('assigned_at', todayStart)
            .lte('assigned_at', todayEnd)
            .range(page * 1000, (page + 1) * 1000 - 1);

        if (error) {
            console.error("Error fetching leads:", error.message);
            return;
        }

        allAssignedLeads = allAssignedLeads.concat(leads);
        hasMore = leads.length === 1000;
        page++;
    }

    // Filter to JUST the ones we did manually (Source: Manual Distribution OR the 130 leads whose created_at is also today)
    // Both distributions used a specific target: either "Manual Distribution (Himanshu VIPs)" or natural organic meta leads re-assigned today.
    const manualLeads = allAssignedLeads.filter(l => l.source && l.source.includes('Manual Distribution') || l.source.includes('Himanshu'));

    console.log(`✅ Total Leads Manually Assigned/Distributed Today in this Group: ${manualLeads.length}\n`);

    // 3. Tally who got what
    const userLeadCounts = {};
    manualLeads.forEach(l => {
        userLeadCounts[l.assigned_to] = (userLeadCounts[l.assigned_to] || 0) + 1;
    });

    // 4. Print list of who received leads
    const receivedUsers = [];
    const zeroUsers = [];

    teamUsers.forEach(u => {
        const count = userLeadCounts[u.id] || 0;
        if (count > 0) {
            receivedUsers.push({ name: u.name, plan: u.plan_name, count: count });
        } else {
            zeroUsers.push({ name: u.name, plan: u.plan_name, email: u.email, dbToday: u.leads_today });
        }
    });

    // Sort receivers by count descending
    receivedUsers.sort((a, b) => b.count - a.count);

    console.log("============= R E C E I V E R S =============");
    console.log(`Total ${receivedUsers.length} users received leads today:`);
    receivedUsers.forEach(u => {
        console.log(` 🟢 ${u.name} [${u.plan}]: ${u.count} leads`);
    });

    console.log("\n============= Z E R O   C O U N T S =============");
    console.log(`Total ${zeroUsers.length} ACTIVE TEAMFIRE users have received 0 leads today:`);
    zeroUsers.forEach(u => {
        // Just verify if their DB leads_today is also 0
        const tag = u.dbToday > 0 ? `(WARNING: DB says leads_today = ${u.dbToday})` : '';
        console.log(` 🔴 ${u.name} (${u.email}) [${u.plan}] ${tag}`);
    });

}

main().catch(console.error);
