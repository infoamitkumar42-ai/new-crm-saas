const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function diagnose() {
    console.log("🕵️ DIAGNOSING LEADS_TODAY SYNC...");

    const usersToCheck = [
        'officialrajinderdhillon@gmail.com', // The victim
        'sameerchauhan010424@gmail.com'      // The glutton (Starter plan, got 8 leads?)
    ];

    const today = new Date().toISOString().split('T')[0];

    for (const email of usersToCheck) {
        // 1. Get User Profile
        const { data: u } = await supabase
            .from('users')
            .select('id, name, email, leads_today, daily_limit, daily_limit_override, team_code')
            .eq('email', email)
            .single();

        if (!u) {
            console.log(`❌ User not found: ${email}`);
            continue;
        }

        // 2. Count ACTUAL leads today
        const { count, error } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', u.id)
            .gte('created_at', today);

        console.log(`\n👤 ${u.name} (${u.email})`);
        console.log(`   - Team: ${u.team_code}`);
        console.log(`   - Daily Limit: ${u.daily_limit_override || u.daily_limit}`);
        console.log(`   - DB 'leads_today' Column: ${u.leads_today}`);
        console.log(`   - ACTUAL Leads Table Count: ${count}`);

        if (u.leads_today !== count) {
            console.log(`   ⚠️ MISMATCH DETECTED! Trigger might be broken.`);
            console.log(`   (Webhook sees ${u.leads_today}, but reality is ${count})`);
        } else {
            console.log(`   ✅ Counts match.`);
        }
    }
}

diagnose();
