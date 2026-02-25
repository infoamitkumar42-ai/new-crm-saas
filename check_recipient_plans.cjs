const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("🔍 Extracting exactly which `starter` plans received leads...\n");

    const TEAM_CODE = 'TEAMFIRE';
    const TARGET_PLAN = 'starter';

    // 1. Fetch eligible Starter users in TEAMFIRE
    // Since our distribution script did `ilike('plan_name', '%starter%')`, let's see which plans had this
    const { data: teamUsers, error: tErr } = await supabase
        .from('users')
        .select('name, plan_name')
        .eq('team_code', TEAM_CODE)
        .eq('is_active', true)
        .ilike('plan_name', `%${TARGET_PLAN}%`);

    const plans = {};
    if (teamUsers) {
        teamUsers.forEach(u => {
            plans[u.plan_name] = (plans[u.plan_name] || 0) + 1;
        });
    }

    console.log("Plans of the 42 users who received leads today:");
    for (const [plan, count] of Object.entries(plans)) {
        console.log(` - ${plan}: ${count} users`);
    }
}

main().catch(console.error);
