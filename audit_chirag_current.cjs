const { createClient } = require('@supabase/supabase-js');

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
    console.log("📊 CHIRAG TEAM (GJ01TEAMFIRE) - CURRENT STATUS AUDIT\n");

    const { data: activeUsers } = await supabase.from('users')
        .select('id, name, plan_name')
        .eq('team_code', 'GJ01TEAMFIRE')
        .eq('is_active', true)
        .order('name');

    if (!activeUsers || activeUsers.length === 0) {
        console.log("No active users found in GJ01TEAMFIRE.");
        return;
    }

    const userIds = activeUsers.map(u => u.id);
    const { data: pays } = await supabase.from('payments')
        .select('user_id, amount, plan_name')
        .eq('status', 'captured')
        .in('user_id', userIds);

    const paysByUser = {};
    if (pays) pays.forEach(p => { if (!paysByUser[p.user_id]) paysByUser[p.user_id] = []; paysByUser[p.user_id].push(p); });

    let grandPending = 0;
    let validUserCount = 0;
    const report = [];

    for (let u of activeUsers) {
        const userPays = paysByUser[u.id] || [];

        let promised = 0;
        userPays.forEach(p => {
            promised += PLAN_QUOTAS[(p.plan_name || u.plan_name || '').toLowerCase()] || 0;
        });

        // Even if promised is 0 (Kaushal, Bhumit), we show them for transparency
        const { count: delivered } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id);

        const pending = Math.max(0, promised - (delivered || 0));

        if (promised > 0) {
            grandPending += pending;
            validUserCount++;
        }

        report.push({
            name: u.name,
            plan: u.plan_name,
            promised,
            delivered: delivered || 0,
            pending
        });
    }

    report.sort((a, b) => b.pending - a.pending);

    console.log(`Total Active Users in Team: ${activeUsers.length}`);
    console.log(`Active Users with Valid Payments: ${validUserCount}\n`);

    console.log("=== PENDING LEAD QUOTAS ===");
    const stillPending = report.filter(r => r.pending > 0);

    if (stillPending.length === 0) {
        console.log("  ✅ No users pending! Everyone's quota is full!");
    } else {
        stillPending.forEach(r => console.log(`  - ${r.name} (${r.plan}): Promised=${r.promised}, Got=${r.delivered}, 🔥 PENDING=${r.pending}`));
    }

    console.log("\n=== COMPLETED / NO PAYMENT ===");
    const quotaZero = report.filter(r => r.pending === 0);
    quotaZero.forEach(r => {
        if (r.promised === 0) {
            console.log(`  - ${r.name} (${r.plan}): Promised=0 (No Payments), Got=${r.delivered}`);
        } else {
            console.log(`  - ${r.name} (${r.plan}): Promised=${r.promised}, Got=${r.delivered} ✅ FULFILLED`);
        }
    });

    console.log(`\n🔥 TOTAL REMAINING LEADS REQUIRED: ${grandPending}`);
}

main().catch(console.error);
