const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Define expected limits per plan. Adjust these if your system uses different numbers.
const PLAN_LIMITS = {
    'starter': 50,
    'weekly_boost': 100, // Guessing - adjust as needed
    'manager': 200,      // Guessing - adjust as needed
    'supervisor': 150,   // Guessing - adjust as needed
    'turbo_boost': 250   // Guessing - adjust as needed
};

async function main() {
    console.log("🔍 Auditing ACTIVE users to check for exceeded quotas...\n");

    // 1. Fetch ALL active users
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, name, email, plan_name, is_active')
        .eq('is_active', true);

    if (uErr) {
        console.error("Error fetching users:", uErr.message);
        return;
    }

    console.log(`Analyzing ${users.length} currently Active users...`);

    // 2. Fetch latest payment for each user to know when their cycle started
    const { data: payments, error: pErr } = await supabase
        .from('payments')
        .select('user_id, created_at')
        .eq('status', 'captured')
        .order('created_at', { ascending: false });

    if (pErr) console.error("Error fetching payments:", pErr.message);

    const userLatestPaymentDate = {};
    if (payments) {
        // Since it's ordered descending, the first one we see per user is their latest
        for (let p of payments) {
            if (!userLatestPaymentDate[p.user_id]) {
                userLatestPaymentDate[p.user_id] = new Date(p.created_at);
            }
        }
    }

    const overLimitUsers = [];

    // 3. Check leads assigned since that latest payment date
    for (let u of users) {
        // If no payment found, maybe they are old users or manually added. We'll check all-time leads.
        const startDate = userLatestPaymentDate[u.id] || new Date(0);

        const { data: leads, error: lErr } = await supabase
            .from('leads')
            .select('id, created_at, assigned_at')
            .eq('assigned_to', u.id)
            // Using created_at or assigned_at as fallback
            .gte('created_at', startDate.toISOString());

        if (lErr) continue;

        // Count how many leads they received since their last payment
        let leadsSincePayment = leads.length;

        const limit = PLAN_LIMITS[u.plan_name] || 9999; // If unknown plan, assume massive limit

        if (leadsSincePayment >= limit) {
            overLimitUsers.push({
                name: u.name,
                email: u.email,
                plan: u.plan_name,
                leadsReceived: leadsSincePayment,
                limit: limit,
                lastPaymentStr: userLatestPaymentDate[u.id] ? userLatestPaymentDate[u.id].toISOString().split('T')[0] : 'Unknown'
            });
        }
    }

    if (overLimitUsers.length === 0) {
        console.log("\n✅ All Active users are well within their expected quotas. Everything is working perfectly.");
    } else {
        console.log(`\n⚠️ Found ${overLimitUsers.length} ACTIVE users who have received leads EQUAL TO OR EXCEEDING their assumed limits!`);
        overLimitUsers.sort((a, b) => b.leadsReceived - a.leadsReceived).forEach(u => {
            console.log(`- ${u.name} (${u.email}) | Plan: ${u.plan} | Limit: ~${u.limit} | Leads Received since ${u.lastPaymentStr}: ${u.leadsReceived}`);
        });
        console.log("\n* Note: The script used standard limits (Starter=50, Weekly=100, Manager=200). If limits differ, these results might vary.");
    }
}

main().catch(console.error);
