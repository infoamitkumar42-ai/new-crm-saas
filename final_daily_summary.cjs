
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function finalSummary() {
    console.log("📊 FINAL DAILY STATUS REPORT: Demand vs Supply (Feb 5)\n");

    const teams = ['GJ01TEAMFIRE', 'TEAMRAJ', 'TEAMFIRE'];
    const TeamNames = { 'GJ01TEAMFIRE': 'Chirag', 'TEAMRAJ': 'Rajwinder', 'TEAMFIRE': 'Himanshu' };

    let grandTotalGoal = 0;
    let grandTotalDelivered = 0;
    let grandTotalPending = 0;

    for (const team of teams) {
        // Get Active Users with Daily Limit > 0
        const { data: users } = await supabase.from('users')
            .select('id, daily_limit, leads_today')
            .eq('team_code', team)
            .eq('is_active', true)
            .gt('daily_limit', 0);

        if (!users) continue;

        const totalGoal = users.reduce((sum, u) => sum + u.daily_limit, 0);
        const delivered = users.reduce((sum, u) => sum + u.leads_today, 0);

        let pending = 0;
        users.forEach(u => {
            const gap = u.daily_limit - u.leads_today;
            if (gap > 0) pending += gap;
        });

        grandTotalGoal += totalGoal;
        grandTotalDelivered += delivered;
        grandTotalPending += pending;

        console.log(`🏆 TEAM: ${TeamNames[team]}`);
        console.log(`   👥 Active Members:    ${users.length}`);
        console.log(`   🎯 Daily Quota (Goal): ${totalGoal} Leads`);
        console.log(`   ✅ Delivered Today:    ${delivered} Leads`);
        console.log(`   🚨 PENDING REMAINING:   ${pending} Leads`);
        console.log('------------------------------------------------');
    }

    console.log("\n🌍 SYSTEM-WIDE TOTALS:");
    console.log(`   🎯 Total Goal:      ${grandTotalGoal} Leads`);
    console.log(`   ✅ Total Delivered: ${grandTotalDelivered} Leads`);
    console.log(`   🔥 TOTAL PENDING:   ${grandTotalPending} Leads`);
}

finalSummary();
