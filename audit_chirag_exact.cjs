const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const PLAN_QUOTAS = {
    'starter': 55,
    'supervisor': 115,
    'manager': 176,
    'weekly_boost': 92,
    'turbo_boost': 108
};

async function main() {
    console.log("📊 AUDIT: Chirag Team (GJ01TEAMFIRE) Active Users\n");

    // 1. Fetch the 15 active users in Chirag's team
    const { data: activeUsers } = await supabase.from('users')
        .select('id, name, email, plan_name')
        .eq('team_code', 'GJ01TEAMFIRE')
        .eq('is_active', true)
        .order('name');

    console.log(`Checking ${activeUsers.length} Active Users...\n`);

    // 2. Fetch all successful payments for these users
    const userIds = activeUsers.map(u => u.id);
    let allPayments = [];
    // Batch fetch in case there are many (though only 15 users here)
    for (let i = 0; i < userIds.length; i += 50) {
        const batch = userIds.slice(i, i + 50);
        const { data: pays } = await supabase.from('payments')
            .select('user_id, created_at, amount, plan_name')
            .eq('status', 'captured')
            .in('user_id', batch)
            .order('created_at', { ascending: true });
        if (pays) allPayments = allPayments.concat(pays);
    }

    const paysByUser = {};
    for (let p of allPayments) {
        if (!paysByUser[p.user_id]) paysByUser[p.user_id] = [];
        paysByUser[p.user_id].push(p);
    }

    let grandPromised = 0;
    let grandDelivered = 0;
    let grandPending = 0;
    let overQuotaCount = 0;

    const reportRows = [];

    // 3. Calculate for each user
    for (let u of activeUsers) {
        const userPays = paysByUser[u.id] || [];

        let totalPromised = 0;
        const paymentDetails = [];

        for (let p of userPays) {
            const plan = p.plan_name || u.plan_name || '';
            const quota = PLAN_QUOTAS[plan.toLowerCase()] || 0;
            totalPromised += quota;
            paymentDetails.push(`${new Date(p.created_at).toISOString().split('T')[0]} (₹${p.amount} ${plan})`);
        }

        // Fetch total lifetime leads delivered to this user
        const { count } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id);

        const delivered = count || 0;
        const pending = Math.max(0, totalPromised - delivered);
        const overDelivered = delivered > totalPromised ? delivered - totalPromised : 0;

        grandPromised += totalPromised;
        grandDelivered += delivered;
        grandPending += pending;

        if (overDelivered > 0) overQuotaCount++;

        reportRows.push({
            name: u.name,
            currentPlan: u.plan_name || 'N/A',
            numPayments: userPays.length,
            paymentDates: paymentDetails.join(' | '),
            promised: totalPromised,
            delivered: delivered,
            pending: pending,
            over: overDelivered
        });
    }

    // Sort by pending (highest first)
    reportRows.sort((a, b) => b.pending - a.pending);

    // 4. Print Summary
    console.log("=== EXACT USER QUOTA DETAILS ===");
    reportRows.forEach(r => {
        let flag = r.pending > 0 ? `✅ PENDING: ${r.pending}` : `🛑 OVER: +${r.over} (Quota Full!)`;
        if (r.numPayments === 0) flag = "❓ NO PAYMENTS FOUND";

        console.log(`\n👤 ${r.name} (${r.currentPlan})`);
        console.log(`   Payments (${r.numPayments}): ${r.numPayments > 0 ? r.paymentDates : 'None'}`);
        console.log(`   Promised: ${r.promised} | Got: ${r.delivered} | ${flag}`);
    });

    console.log("\n========================================");
    console.log(`Total Active Users Analyzed: ${activeUsers.length}`);
    console.log(`Users with Pending Leads: ${reportRows.filter(r => r.pending > 0).length}`);
    console.log(`Users FULL (Over-Quota but Active): ${overQuotaCount}`);
    console.log(`\nGrand Total Promised (All Payments): ${grandPromised}`);
    console.log(`Grand Total Delivered (Lifetime): ${grandDelivered}`);
    console.log(`🔥 TOTAL NEW LEADS NEEDED FOR CHIRAG TEAM: ${grandPending}`);
    console.log("========================================");
}

main().catch(console.error);
