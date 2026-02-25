const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// CORRECT Plan Quotas from official LeadFlow pricing (Total Leads + Replacement Limit)
const PLAN_QUOTAS = {
    'starter': 55,        // 50 + 5
    'supervisor': 115,    // 105 + 10
    'manager': 176,       // 160 + 16
    'weekly_boost': 92,   // 84 + 8
    'turbo_boost': 108    // 98 + 10
};

async function main() {
    console.log("📊 TEAMFIRE - DETAILED PAYMENT AUDIT & PENDING LEADS\n");
    console.log("Plan Quotas Used: Starter=55, Supervisor=115, Manager=176, Weekly=92, Turbo=108\n");

    // 1. Fetch all active TEAMFIRE users
    const { data: activeUsers } = await supabase.from('users')
        .select('id, name, plan_name')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true)
        .order('name');

    if (!activeUsers || activeUsers.length === 0) {
        console.log("No active users found.");
        return;
    }

    console.log(`Total Active Users: ${activeUsers.length}\n`);

    // 2. Fetch ALL payments for these users (not just captured - let's see everything)
    const userIds = activeUsers.map(u => u.id);
    const { data: allPayments } = await supabase.from('payments')
        .select('user_id, amount, plan_name, status, created_at')
        .in('user_id', userIds)
        .order('created_at', { ascending: true });

    const paysByUser = {};
    if (allPayments) allPayments.forEach(p => {
        if (!paysByUser[p.user_id]) paysByUser[p.user_id] = [];
        paysByUser[p.user_id].push(p);
    });

    let grandPending = 0;
    let paidUsersCount = 0;
    let noPaidCount = 0;
    const report = [];

    for (let u of activeUsers) {
        const userPays = paysByUser[u.id] || [];
        const capturedPays = userPays.filter(p => p.status === 'captured');

        // Count only CAPTURED payments
        let promised = 0;
        const payDetails = [];

        capturedPays.forEach(p => {
            const planKey = (p.plan_name || '').toLowerCase();
            const quota = PLAN_QUOTAS[planKey] || 0;
            promised += quota;
            const dateStr = p.created_at ? p.created_at.split('T')[0] : 'unknown';
            payDetails.push(`₹${p.amount} (${p.plan_name}, ${dateStr})`);
        });

        // Lifetime delivered leads
        const { count: delivered } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id);

        const pending = Math.max(0, promised - (delivered || 0));

        if (capturedPays.length > 0) {
            paidUsersCount++;
            grandPending += pending;
        } else {
            noPaidCount++;
        }

        report.push({
            name: u.name,
            plan: u.plan_name,
            numPayments: capturedPays.length,
            payDetails,
            promised,
            delivered: delivered || 0,
            pending
        });
    }

    // Sort by pending descending
    report.sort((a, b) => b.pending - a.pending);

    console.log(`Users with Valid (Captured) Payments: ${paidUsersCount}`);
    console.log(`Users with ZERO Payments: ${noPaidCount}\n`);

    console.log("======================================================================");
    console.log("DETAILED USER-BY-USER REPORT (Sorted by Pending Leads DESC)");
    console.log("======================================================================\n");

    const pendingUsers = report.filter(r => r.pending > 0);
    const fulfilledUsers = report.filter(r => r.pending === 0 && r.numPayments > 0);
    const noPaidUsers = report.filter(r => r.numPayments === 0);

    console.log(`=== USERS WITH PENDING LEADS (${pendingUsers.length}) ===`);
    pendingUsers.forEach(r => {
        console.log(`📌 ${r.name} (${r.plan})`);
        console.log(`   Payments (${r.numPayments}x): ${r.payDetails.join(' | ')}`);
        console.log(`   Promised: ${r.promised} | Delivered: ${r.delivered} | 🔥 PENDING: ${r.pending}`);
        console.log("");
    });

    console.log(`=== USERS WITH QUOTA FULFILLED (${fulfilledUsers.length}) ===`);
    fulfilledUsers.forEach(r => {
        console.log(`✅ ${r.name} (${r.plan}): Promised=${r.promised}, Got=${r.delivered} - DONE`);
    });

    console.log(`\n=== USERS WITH ZERO PAYMENTS (${noPaidUsers.length}) ===`);
    noPaidUsers.forEach(r => {
        console.log(`❌ ${r.name} (${r.plan}): No Payment, Got=${r.delivered} leads`);
    });

    console.log(`\n======================================================================`);
    console.log(`🔥 GRAND TOTAL REMAINING LEADS REQUIRED: ${grandPending}`);
    console.log(`======================================================================`);
}

main().catch(console.error);
