const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Official LeadFlow Plan Quotas (Total Leads + Replacement)
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

    // 2. Fetch ALL captured payments
    const { data: allPayments } = await supabase.from('payments')
        .select('user_id, amount, plan_name, status, created_at, razorpay_payment_id')
        .eq('status', 'captured')
        .in('user_id', userIds)
        .order('created_at', { ascending: true });

    const paysByUser = {};
    if (allPayments) allPayments.forEach(p => {
        if (!paysByUser[p.user_id]) paysByUser[p.user_id] = [];
        paysByUser[p.user_id].push(p);
    });

    let grandTotal = { janPays: 0, janAmount: 0, janPromised: 0, febPays: 0, febAmount: 0, febPromised: 0, totalPromised: 0, totalDelivered: 0, totalPending: 0 };
    const rows = [];

    for (let u of activeUsers) {
        const userPays = paysByUser[u.id] || [];
        if (userPays.length === 0) continue; // Skip zero-payment users for this report

        let janPays = [], febPays = [];
        let janPromised = 0, febPromised = 0, janAmount = 0, febAmount = 0;

        userPays.forEach(p => {
            const month = p.created_at ? parseInt(p.created_at.split('-')[1]) : 0;
            const planKey = (p.plan_name || '').toLowerCase();
            const quota = PLAN_QUOTAS[planKey] || 0;

            if (month === 1) {
                janPays.push(`${p.plan_name}(₹${p.amount})`);
                janPromised += quota;
                janAmount += p.amount;
            } else if (month === 2) {
                febPays.push(`${p.plan_name}(₹${p.amount})`);
                febPromised += quota;
                febAmount += p.amount;
            }
        });

        const totalPromised = janPromised + febPromised;

        const { count: delivered } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id);

        const pending = Math.max(0, totalPromised - (delivered || 0));

        rows.push({
            name: u.name,
            janPays: janPays.join(', ') || '-',
            janCount: janPays.length,
            janAmount,
            janPromised,
            febPays: febPays.join(', ') || '-',
            febCount: febPays.length,
            febAmount,
            febPromised,
            totalPromised,
            delivered: delivered || 0,
            pending
        });

        grandTotal.janPays += janPays.length;
        grandTotal.janAmount += janAmount;
        grandTotal.janPromised += janPromised;
        grandTotal.febPays += febPays.length;
        grandTotal.febAmount += febAmount;
        grandTotal.febPromised += febPromised;
        grandTotal.totalPromised += totalPromised;
        grandTotal.totalDelivered += (delivered || 0);
        grandTotal.totalPending += pending;
    }

    rows.sort((a, b) => b.pending - a.pending);

    // Print clean report
    const lines = [];
    lines.push("=============================================================================");
    lines.push("TEAMFIRE - MONTHLY PAYMENT AUDIT REPORT (Feb 23, 2026)");
    lines.push("=============================================================================");
    lines.push(`Plan Quotas: Starter=55, Supervisor=115, Manager=176, Weekly=92, Turbo=108`);
    lines.push("");
    lines.push("SUMMARY:");
    lines.push(`  January Payments: ${grandTotal.janPays} payments, ₹${grandTotal.janAmount} total, ${grandTotal.janPromised} leads promised`);
    lines.push(`  February Payments: ${grandTotal.febPays} payments, ₹${grandTotal.febAmount} total, ${grandTotal.febPromised} leads promised`);
    lines.push(`  GRAND TOTAL: Promised=${grandTotal.totalPromised} | Delivered=${grandTotal.totalDelivered} | PENDING=${grandTotal.totalPending}`);
    lines.push("");
    lines.push("=============================================================================");
    lines.push("USER-WISE BREAKDOWN (Sorted by Pending DESC)");
    lines.push("=============================================================================");
    lines.push("");

    rows.forEach((r, i) => {
        lines.push(`${i + 1}. ${r.name}`);
        lines.push(`   JAN: ${r.janCount > 0 ? r.janCount + ' payment(s) -> ' + r.janPays + ' = ' + r.janPromised + ' leads' : 'No payment'}`);
        lines.push(`   FEB: ${r.febCount > 0 ? r.febCount + ' payment(s) -> ' + r.febPays + ' = ' + r.febPromised + ' leads' : 'No payment'}`);
        lines.push(`   TOTAL: Promised=${r.totalPromised} | Delivered=${r.delivered} | PENDING=${r.pending}`);
        lines.push("");
    });

    lines.push("=============================================================================");
    lines.push(`GRAND TOTAL PENDING LEADS: ${grandTotal.totalPending}`);
    lines.push("=============================================================================");

    const output = lines.join('\n');
    console.log(output);

    // Also save to file
    require('fs').writeFileSync('teamfire_monthly_audit.txt', output, 'utf8');
    console.log("\nSaved to teamfire_monthly_audit.txt");
}

main().catch(console.error);
