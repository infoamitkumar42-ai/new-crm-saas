const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function scanExhausted() {
    console.log(`🔍 SCANNING FOR EXHAUSTED QUOTAS WITH RECENT PAYMENTS...`);

    // 1. Find users who reached their limit
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, total_leads_promised, total_leads_received, team_code')
        .eq('is_active', true)
        .eq('role', 'member');

    if (error) {
        console.error(error);
        return;
    }

    const exhausted = users.filter(u => u.total_leads_received >= (u.total_leads_promised - 2)); // Buffer of 2
    console.log(`Found ${exhausted.length} users near or at limit.`);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const user of exhausted) {
        // 2. Check for recent payments
        const { data: payments } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'captured')
            .gte('created_at', sevenDaysAgo.toISOString());

        if (payments && payments.length > 0) {
            console.log(`\n⚠️ POTENTIAL STALE USER: ${user.name} (${user.email})`);
            console.log(`   - Team: ${user.team_code}`);
            console.log(`   - Limit: ${user.total_leads_received}/${user.total_leads_promised}`);
            console.log(`   - Recent Payment: ${payments[0].plan_name} on ${new Date(payments[0].created_at).toLocaleDateString()}`);
        }
    }
}

scanExhausted();
