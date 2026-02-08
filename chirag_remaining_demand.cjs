
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkRemainingDemand() {
    console.log("📉 CALCULATING REMAINING DEMAND FOR CHIRAG TEAM (Feb 5)...\n");

    const { data: users } = await supabase.from('users')
        .select('name, daily_limit, leads_today')
        .eq('team_code', 'GJ01TEAMFIRE')
        .eq('is_active', true)
        .gt('daily_limit', 0);

    if (!users) return console.log("No active users found for Chirag.");

    let totalPending = 0;
    let usersWithPending = 0;

    console.log("👤 USER-WISE BREAKDOWN:");
    users.forEach(u => {
        const pending = Math.max(0, u.daily_limit - u.leads_today);
        if (pending > 0) {
            totalPending += pending;
            usersWithPending++;
            console.log(`   - ${u.name}: Needs ${pending} more (Got ${u.leads_today}/${u.daily_limit})`);
        }
    });

    console.log(`\n------------------------------------------------`);
    console.log(`📊 TOTAL LEADS ACQUIRED:  ~162 (So far today)`);
    console.log(`🔥 MORE LEADS NEEDED:     ${totalPending}`);
    console.log(`------------------------------------------------`);

    const grandTotalTarget = 162 + totalPending;
    console.log(`🎯 DAY'S GOAL (Estimated): ~${grandTotalTarget} Leads`);
}

checkRemainingDemand();
