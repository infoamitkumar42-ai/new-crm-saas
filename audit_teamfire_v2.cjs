const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// CORRECT Plan Quotas from official LeadFlow pricing (Total Leads + Replacement)
const PLAN_QUOTAS = {
    'starter': 55,        // 50 + 5
    'supervisor': 115,    // 105 + 10
    'manager': 176,       // 160 + 16
    'weekly_boost': 92,   // 84 + 8
    'turbo_boost': 108    // 98 + 10
};

async function main() {
    // 1. Fetch all active TEAMFIRE users
    const { data: activeUsers } = await supabase.from('users')
        .select('id, name, plan_name')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true)
        .order('name');

    const userIds = activeUsers.map(u => u.id);

    // 2. Fetch ALL payments
    const { data: allPayments } = await supabase.from('payments')
        .select('user_id, amount, plan_name, status, created_at, razorpay_payment_id')
        .in('user_id', userIds)
        .order('created_at', { ascending: true });

    const paysByUser = {};
    if (allPayments) allPayments.forEach(p => {
        if (!paysByUser[p.user_id]) paysByUser[p.user_id] = [];
        paysByUser[p.user_id].push(p);
    });

    let grandPending = 0;
    let paidCount = 0;
    let noPaidCount = 0;
    const pendingList = [];
    const fulfilledList = [];
    const noPaidList = [];

    for (let u of activeUsers) {
        const userPays = paysByUser[u.id] || [];
        const capturedPays = userPays.filter(p => p.status === 'captured');

        let promised = 0;
        capturedPays.forEach(p => {
            const planKey = (p.plan_name || '').toLowerCase();
            promised += PLAN_QUOTAS[planKey] || 0;
        });

        const { count: delivered } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id);

        const pending = Math.max(0, promised - (delivered || 0));

        const entry = {
            name: u.name,
            plan: u.plan_name,
            numPayments: capturedPays.length,
            payments: capturedPays.map(p => ({
                amount: p.amount,
                plan: p.plan_name,
                date: p.created_at ? p.created_at.split('T')[0] : '?',
                razorpay: p.razorpay_payment_id || 'N/A'
            })),
            promised,
            delivered: delivered || 0,
            pending
        };

        if (capturedPays.length === 0) {
            noPaidCount++;
            noPaidList.push(entry);
        } else if (pending > 0) {
            paidCount++;
            grandPending += pending;
            pendingList.push(entry);
        } else {
            paidCount++;
            fulfilledList.push(entry);
        }
    }

    pendingList.sort((a, b) => b.pending - a.pending);

    // ===== CLEAN OUTPUT =====
    console.log("=========================================================");
    console.log("TEAMFIRE - VERIFIED PAYMENT AUDIT (Feb 23, 2026)");
    console.log("=========================================================");
    console.log(`Active Users: ${activeUsers.length} | Paid: ${paidCount + noPaidCount - noPaidCount} | No Payment: ${noPaidCount}\n`);

    console.log(`--- PENDING USERS (${pendingList.length}) ---\n`);
    pendingList.forEach((r, i) => {
        console.log(`${i + 1}. ${r.name} (${r.plan}) | Payments: ${r.numPayments}x`);
        r.payments.forEach((p, j) => {
            console.log(`   Pay ${j + 1}: ₹${p.amount} ${p.plan} on ${p.date} [${p.razorpay}]`);
        });
        console.log(`   >>> Promised=${r.promised} | Got=${r.delivered} | PENDING=${r.pending}\n`);
    });

    console.log(`--- FULFILLED USERS (${fulfilledList.length}) ---\n`);
    fulfilledList.forEach(r => {
        console.log(`✅ ${r.name}: ${r.numPayments} payment(s), Promised=${r.promised}, Got=${r.delivered}`);
    });

    console.log(`\n--- NO PAYMENT USERS (${noPaidList.length}) ---\n`);
    noPaidList.forEach(r => {
        console.log(`❌ ${r.name} (${r.plan}): 0 payments, Got=${r.delivered} leads`);
    });

    console.log(`\n=========================================================`);
    console.log(`🔥 TOTAL PENDING LEADS: ${grandPending}`);
    console.log(`=========================================================`);
}

main().catch(console.error);
