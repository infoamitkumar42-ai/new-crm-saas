const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Determine plan from AMOUNT (not trusting plan_name blindly)
function getPlanFromAmount(amount, planNameHint) {
    amount = Number(amount);
    if (amount === 999) return { plan: 'starter', leads: 55 };
    if (amount === 1999) {
        // Could be supervisor (115) or weekly_boost (92). Use plan_name hint
        const hint = (planNameHint || '').toLowerCase();
        if (hint.includes('weekly') || hint.includes('boost')) return { plan: 'weekly_boost', leads: 92 };
        return { plan: 'supervisor', leads: 115 };
    }
    if (amount === 2999) return { plan: 'manager', leads: 176 };
    if (amount === 2499) return { plan: 'turbo_boost', leads: 108 };
    // Unknown amount - try plan_name
    return { plan: planNameHint || 'unknown', leads: 0 };
}

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

    // 3. DEDUPLICATE by razorpay_payment_id (same ID = same transaction, count once)
    const paysByUser = {};
    const seenRazorpayIds = new Set();

    if (allPayments) {
        allPayments.forEach(p => {
            const rpId = p.razorpay_payment_id || `unique_${Math.random()}`;

            // Skip if we've already counted this Razorpay transaction
            if (seenRazorpayIds.has(rpId)) {
                return; // DUPLICATE - skip!
            }
            seenRazorpayIds.add(rpId);

            if (!paysByUser[p.user_id]) paysByUser[p.user_id] = [];
            paysByUser[p.user_id].push(p);
        });
    }

    let grandTotal = { janPays: 0, janAmount: 0, janPromised: 0, febPays: 0, febAmount: 0, febPromised: 0, totalPromised: 0, totalDelivered: 0, totalPending: 0 };
    const rows = [];

    for (let u of activeUsers) {
        const userPays = paysByUser[u.id] || [];
        if (userPays.length === 0) continue;

        let janPaysList = [], febPaysList = [];
        let janPromised = 0, febPromised = 0, janAmount = 0, febAmount = 0;

        userPays.forEach(p => {
            const month = p.created_at ? parseInt(p.created_at.split('-')[1]) : 0;
            const detected = getPlanFromAmount(p.amount, p.plan_name);

            if (month === 1) {
                janPaysList.push(`${detected.plan}(₹${p.amount})`);
                janPromised += detected.leads;
                janAmount += p.amount;
            } else if (month === 2) {
                febPaysList.push(`${detected.plan}(₹${p.amount})`);
                febPromised += detected.leads;
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
            janPays: janPaysList.join(', ') || '-',
            janCount: janPaysList.length,
            janAmount,
            janPromised,
            febPays: febPaysList.join(', ') || '-',
            febCount: febPaysList.length,
            febAmount,
            febPromised,
            totalPromised,
            delivered: delivered || 0,
            pending
        });

        grandTotal.janPays += janPaysList.length;
        grandTotal.janAmount += janAmount;
        grandTotal.janPromised += janPromised;
        grandTotal.febPays += febPaysList.length;
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
    lines.push("TEAMFIRE - CORRECTED MONTHLY PAYMENT AUDIT (Feb 23, 2026)");
    lines.push("=============================================================================");
    lines.push("FIXES APPLIED:");
    lines.push("  1. Deduplicated payments by Razorpay Payment ID");
    lines.push("  2. Plan determined from AMOUNT (₹999=starter, ₹1999=supervisor/weekly,");
    lines.push("     ₹2999=manager, ₹2499=turbo), NOT from plan_name field");
    lines.push("");
    lines.push("Plan Quotas: Starter=55, Supervisor=115, Manager=176, Weekly=92, Turbo=108");
    lines.push("");
    lines.push("SUMMARY:");
    lines.push(`  January: ${grandTotal.janPays} payments | ₹${grandTotal.janAmount} | ${grandTotal.janPromised} leads promised`);
    lines.push(`  February: ${grandTotal.febPays} payments | ₹${grandTotal.febAmount} | ${grandTotal.febPromised} leads promised`);
    lines.push(`  GRAND TOTAL: Promised=${grandTotal.totalPromised} | Delivered=${grandTotal.totalDelivered} | PENDING=${grandTotal.totalPending}`);
    lines.push("");
    lines.push("=============================================================================");
    lines.push("USER-WISE BREAKDOWN (Sorted by Pending DESC)");
    lines.push("=============================================================================");
    lines.push("");

    rows.forEach((r, i) => {
        lines.push(`${i + 1}. ${r.name}`);
        lines.push(`   JAN: ${r.janCount > 0 ? r.janCount + ' pay -> ' + r.janPays + ' = ' + r.janPromised + ' leads' : 'No payment'}`);
        lines.push(`   FEB: ${r.febCount > 0 ? r.febCount + ' pay -> ' + r.febPays + ' = ' + r.febPromised + ' leads' : 'No payment'}`);
        lines.push(`   TOTAL: Promised=${r.totalPromised} | Delivered=${r.delivered} | PENDING=${r.pending}`);
        lines.push("");
    });

    lines.push("=============================================================================");
    lines.push(`GRAND TOTAL PENDING LEADS: ${grandTotal.totalPending}`);
    lines.push("=============================================================================");

    const output = lines.join('\n');
    console.log(output);
    require('fs').writeFileSync('teamfire_corrected_audit.txt', output, 'utf8');
    console.log("\nSaved to teamfire_corrected_audit.txt");
}

main().catch(console.error);
