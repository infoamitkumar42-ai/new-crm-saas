const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const PLAN_QUOTAS = {
    'starter': 55, 'supervisor': 115, 'manager': 176,
    'weekly_boost': 92, 'turbo_boost': 108
};

async function main() {
    console.log("📊 Active TEAMFIRE Users & Remaining Quota Summary\n");

    const { data: activeUsers } = await supabase
        .from('users')
        .select('id, name, email, plan_name')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true)
        .order('name');

    console.log(`Total ACTIVE Users in TEAMFIRE: ${activeUsers.length}\n`);

    // Fetch all payments for active users
    const userIds = activeUsers.map(u => u.id);
    let allPayments = [];
    for (let i = 0; i < userIds.length; i += 50) {
        const batch = userIds.slice(i, i + 50);
        const { data: pays } = await supabase
            .from('payments')
            .select('user_id, amount, plan_name')
            .eq('status', 'captured')
            .in('user_id', batch);
        if (pays) allPayments = allPayments.concat(pays);
    }

    const paymentsByUser = {};
    for (let p of allPayments) {
        if (!paymentsByUser[p.user_id]) paymentsByUser[p.user_id] = [];
        paymentsByUser[p.user_id].push(p);
    }

    let grandPromised = 0, grandDelivered = 0, grandPending = 0;
    const planBreakdown = {};
    let processedCount = 0;

    for (const u of activeUsers) {
        processedCount++;
        if (processedCount % 10 === 0) console.log(`  Processing ${processedCount}/${activeUsers.length}...`);

        const userPayments = paymentsByUser[u.id] || [];
        let totalPromised = 0;
        for (let p of userPayments) {
            const planName = p.plan_name || u.plan_name || '';
            totalPromised += PLAN_QUOTAS[planName.toLowerCase()] || 0;
        }

        const { count: delivered } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id);

        const pending = Math.max(0, totalPromised - (delivered || 0));

        grandPromised += totalPromised;
        grandDelivered += (delivered || 0);
        grandPending += pending;

        // Track plan breakdown
        const plan = u.plan_name || 'none';
        if (!planBreakdown[plan]) planBreakdown[plan] = { count: 0, pending: 0 };
        planBreakdown[plan].count++;
        planBreakdown[plan].pending += pending;
    }

    console.log("\n========================================");
    console.log("   ACTIVE USERS SUMMARY");
    console.log("========================================");
    console.log(`Total Active Users: ${activeUsers.length}`);
    console.log(`\nPlan-wise Breakdown:`);
    for (let [plan, data] of Object.entries(planBreakdown)) {
        console.log(`  ${plan}: ${data.count} users | Pending Leads: ${data.pending}`);
    }
    console.log(`\nTotal Promised (All Active Users): ${grandPromised}`);
    console.log(`Total Already Delivered: ${grandDelivered}`);
    console.log(`\n🔥 TOTAL LEADS STILL NEEDED TO GENERATE: ${grandPending}`);
}

main().catch(console.error);
