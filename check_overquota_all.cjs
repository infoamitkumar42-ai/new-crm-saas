const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const PLAN_QUOTAS = { 'starter': 55, 'supervisor': 115, 'manager': 176, 'weekly_boost': 92, 'turbo_boost': 108 };

async function main() {
    console.log("🔍 Checking ALL active TEAMFIRE users for over-quota...\n");

    const { data: users } = await supabase.from('users')
        .select('id, name, email, plan_name')
        .eq('team_code', 'TEAMFIRE').eq('is_active', true);

    console.log(`Active users: ${users.length}`);
    const userIds = users.map(u => u.id);

    let allPayments = [];
    for (let i = 0; i < userIds.length; i += 50) {
        const batch = userIds.slice(i, i + 50);
        const { data: pays } = await supabase.from('payments')
            .select('user_id, amount, plan_name').eq('status', 'captured').in('user_id', batch);
        if (pays) allPayments = allPayments.concat(pays);
    }

    const paymentsByUser = {};
    for (let p of allPayments) {
        if (!paymentsByUser[p.user_id]) paymentsByUser[p.user_id] = [];
        paymentsByUser[p.user_id].push(p);
    }

    const overQuota = [];
    let processed = 0;
    for (let u of users) {
        processed++;
        if (processed % 10 === 0) console.log(`  Processing ${processed}/${users.length}...`);

        const userPayments = paymentsByUser[u.id] || [];
        let totalPromised = 0;
        for (let p of userPayments) {
            const plan = p.plan_name || u.plan_name || '';
            totalPromised += PLAN_QUOTAS[plan.toLowerCase()] || 0;
        }

        const { count } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true }).eq('assigned_to', u.id);

        if (totalPromised > 0 && count >= totalPromised) {
            overQuota.push({
                name: u.name, email: u.email, plan: u.plan_name,
                payments: userPayments.length, promised: totalPromised, delivered: count, over: count - totalPromised
            });
        }
    }

    console.log(`\n🛑 OVER-QUOTA ACTIVE USERS: ${overQuota.length}`);
    if (overQuota.length > 0) {
        overQuota.sort((a, b) => b.over - a.over);
        overQuota.forEach(u => {
            console.log(`  - ${u.name} (${u.email}) | ${u.plan} | ${u.payments}x pay | Promised: ${u.promised} | Got: ${u.delivered} | Over: +${u.over}`);
        });
    } else {
        console.log("  ✅ No over-quota users found! Everyone is within limits.");
    }
}

main().catch(console.error);
