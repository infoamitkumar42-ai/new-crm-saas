const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const email = "princyrani303@gmail.com";

async function checkEligibility() {
    const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
    if (!user) return;

    console.log(`👤 User: ${user.name}`);
    console.log(`⏸️ Is Paused: ${user.is_paused}`);
    console.log(`🕒 Last Activity: ${user.last_activity}`);

    // Compare with a member who GOT leads today
    const { data: others } = await supabase
        .from('users')
        .select('name, leads_today, is_paused, last_activity')
        .eq('team_code', 'TEAMFIRE')
        .gt('leads_today', 0)
        .limit(3);

    console.log(`\n👥 Comparison with TEAMFIRE members who GOT leads:`);
    others.forEach(o => {
        console.log(`   - ${o.name}: ${o.leads_today} leads | Paused: ${o.is_paused} | Activity: ${o.last_activity}`);
    });
}

checkEligibility();
