
const { createClient } = require('@supabase/supabase-js');

// Helper to get Plan Config
const PLAN_CONFIG = {
    'starter': 55,       // Daily Limit
    'supervisor': 115,
    'manager': 176, // Assuming manager plan
    'weekly_boost': 92,
    'turbo_boost': 108
};

// Use Service Role Key
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkChiragPayments() {
    console.log("🕵️‍♂️ Checking Payments for Team: GJ01TEAMFIRE...");

    // 1. Get All Team Members
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, name, email, plan_name, is_active')
        .eq('team_code', 'GJ01TEAMFIRE');

    if (uErr) { console.error(uErr); return; }

    console.log(`📋 Total Members Scanned: ${users.length}`);

    // 2. Get Payments for these users (Last 30-45 Days)
    const userIds = users.map(u => u.id);
    const { data: payments, error: pErr } = await supabase
        .from('payments')
        .select('user_id, amount, status, created_at, plan_id') // plan_id holds plan name mostly
        .in('user_id', userIds)
        .eq('status', 'captured')
        .order('created_at', { ascending: false });

    if (pErr) { console.error(pErr); return; }

    // 3. Match Logic
    let activePaidUsers = [];
    let unpaidUsers = [];

    for (const user of users) {
        // Find latest valid payment
        const userPayments = payments.filter(p => p.user_id === user.id);

        // Simple Logic: Has payment > 0 in last 30 days?
        // Or just ANY captured payment recently?
        // Let's check the LATEST payment date.

        let latestPayment = userPayments[0]; // Already sorted desc

        if (latestPayment) {
            const payDate = new Date(latestPayment.created_at);
            const now = new Date();
            const diffDays = Math.floor((now - payDate) / (1000 * 60 * 60 * 24));

            if (diffDays <= 30) {
                // PAID & VALID
                activePaidUsers.push({
                    name: user.name,
                    email: user.email,
                    plan: latestPayment.plan_id || user.plan_name || 'starter', // Fallback
                    paid_date: latestPayment.created_at.split('T')[0],
                    days_ago: diffDays,
                    amount: latestPayment.amount
                });
            } else {
                // EXPIRED
                unpaidUsers.push({ name: user.name, email: user.email, status: `Expired (${diffDays} days ago)` });
            }
        } else {
            // NEVER PAID
            unpaidUsers.push({ name: user.name, email: user.email, status: 'No Payment Found' });
        }
    }

    // 4. PRINT REPORT
    console.log("\n✅ --- ACTIVE PAID USERS (VALID) ---");
    console.table(activePaidUsers);

    console.log("\n❌ --- UNPAID / EXPIRED USERS (SHOULD BE DEACTIVATED) ---");
    console.table(unpaidUsers);

    console.log(`\n📊 Summary: Active: ${activePaidUsers.length} | Inactive: ${unpaidUsers.length}`);
}

checkChiragPayments();
