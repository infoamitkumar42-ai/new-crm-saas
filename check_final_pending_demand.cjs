
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkPending() {
    console.log("📊 CHECKING FINAL PENDING DEMAND (Chirag Team)...");

    const { data: users } = await supabase.from('users')
        .select('name, leads_today, daily_limit')
        .eq('team_code', 'GJ01TEAMFIRE')
        .eq('is_active', true)
        .gt('daily_limit', 0);

    let pendingUsers = 0;
    let leadsNeeded = 0;
    let fullyHappy = 0;

    console.log("\n📝 Users needing more leads:");

    users.forEach(u => {
        const need = u.daily_limit - u.leads_today;
        if (need > 0) {
            console.log(`   - ${u.name}: Has ${u.leads_today}/${u.daily_limit} (Needs ${need})`);
            pendingUsers++;
            leadsNeeded += need;
        } else {
            fullyHappy++;
        }
    });

    console.log(`\n---------------------------`);
    console.log(`✅ Quota Full:   ${fullyHappy} Users`);
    console.log(`⏳ Quota Pending: ${pendingUsers} Users`);
    console.log(`🔥 Total Leads Still Needed: ${leadsNeeded}`);
}

checkPending();
