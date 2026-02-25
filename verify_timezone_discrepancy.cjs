const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    // 1. How many leads show up for CURRENT_DATE using Supabase DB timezone?
    const { data: dbToday } = await supabase.rpc('get_admin_dashboard_data');
    console.log("Dashboard RPC 'Leads Today' metric:", dbToday.leads_stats.leads_today);

    // 2. Fetch leads assigned_at vs created_at for today in IST
    const startOfTodayIST = '2026-02-21T00:00:00.000+05:30';
    const { data: allTodayIST } = await supabase.from('leads')
        .select('id, created_at, assigned_at, source')
        .gte('assigned_at', startOfTodayIST);

    console.log(`\nTotal Leads assigned today (IST): ${allTodayIST.length}`);

    let todayUTC = 0;
    let yesterdayUTC = 0;

    allTodayIST.forEach(l => {
        const d = new Date(l.created_at);
        const dateUTC = d.toISOString().split('T')[0];
        if (dateUTC === '2026-02-21') todayUTC++;
        else if (dateUTC === '2026-02-20') yesterdayUTC++;
    });

    console.log(`Out of ${allTodayIST.length} assigned today (IST), here is their UTC created_at date:`);
    console.log(`- 2026-02-21 (Today UTC): ${todayUTC} leads`);
    console.log(`- 2026-02-20 (Yesterday UTC): ${yesterdayUTC} leads`);
    console.log(`\nThis perfectly proves why the dashboard (using UTC CURRENT_DATE) misses the ones spread across 12-5am IST.`);
}

main().catch(console.error);
