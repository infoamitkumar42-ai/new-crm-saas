
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkChiragTeamStatus() {
    console.log("📊 CHIRAG TEAM (GJ01TEAMFIRE) LIVE STATUS REPORT...\n");

    // 1. Fetch Active Users in Team
    const { data: users } = await supabase.from('users')
        .select('name, daily_limit, leads_today')
        .eq('team_code', 'GJ01TEAMFIRE')
        .eq('is_active', true)
        .gt('daily_limit', 0)
        .order('name');

    if (!users || users.length === 0) return console.log("No active users found.");

    let totalUsers = users.length;
    let quotaFullCount = 0;
    let pendingCount = 0;
    let totalLeadsPending = 0;

    // Arrays to hold names
    const pendingList = [];
    const completedList = [];

    users.forEach(u => {
        const remaining = u.daily_limit - u.leads_today;

        if (remaining <= 0) {
            quotaFullCount++;
            completedList.push(`${u.name} (${u.leads_today}/${u.daily_limit})`);
        } else {
            pendingCount++;
            totalLeadsPending += remaining;
            pendingList.push({
                name: u.name,
                got: u.leads_today,
                limit: u.daily_limit,
                need: remaining
            });
        }
    });

    console.log(`👥 Total Active Members: ${totalUsers}`);
    console.log(`✅ Quota COMPLETED:      ${quotaFullCount} Users`);
    console.log(`⏳ Quota PENDING:        ${pendingCount} Users`);
    console.log(`🔥 Total Leads Needed:   ${totalLeadsPending} Leads to finish day.`);

    console.log(`\n------------------------------------------------`);

    if (pendingCount > 0) {
        console.log(`📉 USERS STILL WAITING (${pendingCount}):`);
        // Sort by 'Need' (High demand first)
        pendingList.sort((a, b) => b.need - a.need);
        console.table(pendingList.map(u => ({
            User: u.name,
            'Has / Limit': `${u.got} / ${u.limit}`,
            'Needs More': u.need
        })));
    } else {
        console.log("🎉 ALL USERS HAVE COMPLETED THEIR QUOTA!");
    }

    if (completedList.length > 0) {
        // console.log(`\n✅ Finished Users: ${completedList.slice(0, 5).join(', ')}... (+${completedList.length-5} more)`);
    }
}

checkChiragTeamStatus();
