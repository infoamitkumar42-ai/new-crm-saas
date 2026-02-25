const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const PLAN_QUOTAS = { 'starter': 55, 'supervisor': 115, 'manager': 176, 'weekly_boost': 92, 'turbo_boost': 108 };

async function main() {
    console.log("📊 Chirag Team (GJ01TEAMFIRE) - Active Users & Pending Quota\n");

    const { data: activeUsers } = await supabase.from('users')
        .select('id, name, plan_name')
        .eq('team_code', 'GJ01TEAMFIRE').eq('is_active', true).order('name');

    console.log(`Active Users: ${activeUsers.length}\n`);

    // Get all payments
    const userIds = activeUsers.map(u => u.id);
    let allPayments = [];
    for (let i = 0; i < userIds.length; i += 50) {
        const batch = userIds.slice(i, i + 50);
        const { data: pays } = await supabase.from('payments')
            .select('user_id, plan_name').eq('status', 'captured').in('user_id', batch);
        if (pays) allPayments = allPayments.concat(pays);
    }
    const paysByUser = {};
    allPayments.forEach(p => { if (!paysByUser[p.user_id]) paysByUser[p.user_id] = []; paysByUser[p.user_id].push(p); });

    let grandPromised = 0, grandDelivered = 0, grandPending = 0;
    const planBreakdown = {};

    for (let u of activeUsers) {
        const userPays = paysByUser[u.id] || [];
        let promised = 0;
        userPays.forEach(p => { promised += PLAN_QUOTAS[(p.plan_name || u.plan_name || '').toLowerCase()] || 0; });

        const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('assigned_to', u.id);
        const delivered = count || 0;
        const pending = Math.max(0, promised - delivered);

        grandPromised += promised;
        grandDelivered += delivered;
        grandPending += pending;

        const plan = u.plan_name || 'none';
        if (!planBreakdown[plan]) planBreakdown[plan] = { count: 0, pending: 0 };
        planBreakdown[plan].count++;
        planBreakdown[plan].pending += pending;

        if (pending > 0) console.log(`  ${u.name} (${plan}): Promised=${promised}, Got=${delivered}, PENDING=${pending}`);
    }

    console.log(`\n--- PLAN-WISE SUMMARY ---`);
    Object.entries(planBreakdown).forEach(([p, d]) => console.log(`  ${p}: ${d.count} users | Pending: ${d.pending}`));

    console.log(`\n--- TOTALS ---`);
    console.log(`Active Users: ${activeUsers.length}`);
    console.log(`Total Promised: ${grandPromised}`);
    console.log(`Total Delivered: ${grandDelivered}`);
    console.log(`🔥 Total PENDING Leads (quota bacha): ${grandPending}`);
}

main().catch(console.error);
