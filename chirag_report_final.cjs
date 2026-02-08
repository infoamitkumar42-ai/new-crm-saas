
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function chiragFinalReport() {
    console.log("📊 CHIRAG TEAM: INDIVIDUAL LEAD DISTRIBUTION REPORT (Today)\n");

    const { data: users, error } = await supabase.from('users')
        .select('name, email, daily_limit, leads_today')
        .eq('team_code', 'GJ01TEAMFIRE')
        .eq('is_active', true)
        .gt('daily_limit', 0)
        .order('leads_today', { ascending: false });

    if (error) return console.error(error);

    let totalDelivered = 0;
    let totalTarget = 0;
    const zeroLeadUsers = [];

    const stats = users.map(u => {
        totalDelivered += u.leads_today;
        totalTarget += u.daily_limit;

        if (u.leads_today === 0) zeroLeadUsers.push(u.name);

        const progress = u.daily_limit > 0 ? Math.round((u.leads_today / u.daily_limit) * 100) : 0;

        return {
            Name: u.name,
            Goal: u.daily_limit,
            Received: u.leads_today,
            Pending: Math.max(0, u.daily_limit - u.leads_today),
            '% Done': progress + '%'
        };
    });

    console.table(stats);

    console.log("\n-----------------------------------------");
    console.log(`✅ TOTAL LEADS ASSIGNED IN TEAM: ${totalDelivered}`);
    console.log(`🎯 TOTAL TEAM GOAL:             ${totalTarget}`);
    console.log(`⏳ STILL PENDING (FOR TODAY):   ${totalTarget - totalDelivered}`);

    if (zeroLeadUsers.length > 0) {
        console.log(`\n🚨 USERS WITH 0 LEADS: ${zeroLeadUsers.length}`);
        console.log(`   - ${zeroLeadUsers.join(', ')}`);
    } else {
        console.log("\n🎉 EXCELLENT! Every active member has received at least some leads today.");
    }
}

chiragFinalReport();
