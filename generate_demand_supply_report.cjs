
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function generateReport() {
    console.log("📊 GENERATING LEAD SUPPLY vs DEMAND REPORT (TODAY)...\n");

    const teams = ['GJ01TEAMFIRE', 'TEAMRAJ', 'TEAMFIRE']; // Chirag, Rajwinder, Himanshu
    const TeamNames = { 'GJ01TEAMFIRE': 'Chirag', 'TEAMRAJ': 'Rajwinder', 'TEAMFIRE': 'Himanshu' };

    for (const team of teams) {
        // 1. Get Active Paid Users
        const { data: users } = await supabase.from('users')
            .select('id, daily_limit, leads_today')
            .eq('team_code', team)
            .eq('is_active', true)
            // Ideally check valid_until too, but is_active is main switch
            .gt('daily_limit', 0);

        if (!users || users.length === 0) {
            console.log(`❌ Team ${TeamNames[team]}: No Active Users.`);
            continue;
        }

        // 2. Calculations
        const TotalUsers = users.length;
        const TotalDemand = users.reduce((sum, u) => sum + u.daily_limit, 0); // Total leads needed to satisfy everyone
        const Delivered = users.reduce((sum, u) => sum + u.leads_today, 0);   // Total leads given
        const Remaining = Math.max(0, TotalDemand - Delivered);               // Backlog for today

        console.log(`🏆 TEAM: ${TeamNames[team]} (${team})`);
        console.log(`   👥 Active Users:    ${TotalUsers}`);
        console.log(`   🎯 Total Goal:      ${TotalDemand} Leads (Sum of Daily Limits)`);
        console.log(`   ✅ Delivered:       ${Delivered} Leads`);
        console.log(`   ⏳ PENDING NEEDED:  ${Remaining} Leads (To hit 100% capacity)`);

        // Load Factor
        const percentage = Math.round((Delivered / TotalDemand) * 100);
        console.log(`   📊 Fulfillment:     ${percentage}% Complete`);
        console.log('------------------------------------------------');
    }
}

generateReport();
