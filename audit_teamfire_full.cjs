const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Determine plan from AMOUNT
function getPlanFromAmount(amount, planNameHint) {
    amount = Number(amount);
    if (amount === 999) return { plan: 'starter', leads: 55 };
    if (amount === 1999) {
        const hint = (planNameHint || '').toLowerCase();
        if (hint.includes('weekly') || hint.includes('boost')) return { plan: 'weekly_boost', leads: 92 };
        return { plan: 'supervisor', leads: 115 };
    }
    if (amount === 2999) return { plan: 'manager', leads: 176 };
    if (amount === 2499) return { plan: 'turbo_boost', leads: 108 };
    return { plan: planNameHint || 'unknown', leads: 0 };
}

async function main() {
    // 1. Fetch ALL TEAMFIRE users (ACTIVE + INACTIVE)
    const { data: allUsers } = await supabase.from('users')
        .select('id, name, plan_name, is_active')
        .eq('team_code', 'TEAMFIRE')
        .order('name');

    console.log(`Total TEAMFIRE users (active + inactive): ${allUsers.length}`);
    const activeCount = allUsers.filter(u => u.is_active).length;
    const inactiveCount = allUsers.filter(u => !u.is_active).length;
    console.log(`Active: ${activeCount} | Inactive/Stopped: ${inactiveCount}\n`);

    const userIds = allUsers.map(u => u.id);

    // 2. Fetch ALL captured payments for ALL users
    // Supabase .in() has a limit, so batch if needed
    let allPayments = [];
    for (let i = 0; i < userIds.length; i += 50) {
        const batch = userIds.slice(i, i + 50);
        const { data } = await supabase.from('payments')
            .select('user_id, amount, plan_name, status, created_at, razorpay_payment_id')
            .eq('status', 'captured')
            .in('user_id', batch)
            .order('created_at', { ascending: true });
        if (data) allPayments = allPayments.concat(data);
    }

    // 3. Deduplicate by razorpay_payment_id
    const paysByUser = {};
    const seenRazorpayIds = new Set();

    allPayments.forEach(p => {
        const rpId = p.razorpay_payment_id || `unique_${Math.random()}`;
        if (seenRazorpayIds.has(rpId)) return;
        seenRazorpayIds.add(rpId);
        if (!paysByUser[p.user_id]) paysByUser[p.user_id] = [];
        paysByUser[p.user_id].push(p);
    });

    let grandTotal = { janPays: 0, janAmount: 0, janPromised: 0, febPays: 0, febAmount: 0, febPromised: 0, totalPromised: 0, totalDelivered: 0, totalPending: 0 };
    const pendingRows = [];
    const doneRows = [];
    const noPaidRows = [];

    for (let u of allUsers) {
        const userPays = paysByUser[u.id] || [];

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
        const status = u.is_active ? 'ACTIVE' : 'STOPPED';

        const entry = {
            name: u.name,
            status,
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
        };

        grandTotal.janPays += janPaysList.length;
        grandTotal.janAmount += janAmount;
        grandTotal.janPromised += janPromised;
        grandTotal.febPays += febPaysList.length;
        grandTotal.febAmount += febAmount;
        grandTotal.febPromised += febPromised;
        grandTotal.totalPromised += totalPromised;
        grandTotal.totalDelivered += (delivered || 0);
        grandTotal.totalPending += pending;

        if (userPays.length === 0) {
            noPaidRows.push(entry);
        } else if (pending > 0) {
            pendingRows.push(entry);
        } else {
            doneRows.push(entry);
        }
    }

    pendingRows.sort((a, b) => b.pending - a.pending);

    // Build report
    const lines = [];
    lines.push("=============================================================================");
    lines.push("TEAMFIRE - FULL AUDIT (ALL USERS: ACTIVE + STOPPED) - Feb 23, 2026");
    lines.push("=============================================================================");
    lines.push("FIXES: Deduplicated by Razorpay ID | Plan from Amount | ALL users included");
    lines.push("");
    lines.push(`Total Users: ${allUsers.length} (Active: ${activeCount} | Stopped: ${inactiveCount})`);
    lines.push("");
    lines.push("SUMMARY:");
    lines.push(`  January: ${grandTotal.janPays} payments | ₹${grandTotal.janAmount} | ${grandTotal.janPromised} leads promised`);
    lines.push(`  February: ${grandTotal.febPays} payments | ₹${grandTotal.febAmount} | ${grandTotal.febPromised} leads promised`);
    lines.push(`  GRAND TOTAL: Promised=${grandTotal.totalPromised} | Delivered=${grandTotal.totalDelivered} | PENDING=${grandTotal.totalPending}`);
    lines.push("");
    lines.push("=============================================================================");
    lines.push(`PENDING LEADS USERS (${pendingRows.length})`);
    lines.push("=============================================================================");
    lines.push("");

    pendingRows.forEach((r, i) => {
        lines.push(`${i + 1}. ${r.name} [${r.status}]`);
        lines.push(`   JAN: ${r.janCount > 0 ? r.janCount + ' pay -> ' + r.janPays + ' = ' + r.janPromised + ' leads' : 'No payment'}`);
        lines.push(`   FEB: ${r.febCount > 0 ? r.febCount + ' pay -> ' + r.febPays + ' = ' + r.febPromised + ' leads' : 'No payment'}`);
        lines.push(`   TOTAL: Promised=${r.totalPromised} | Delivered=${r.delivered} | PENDING=${r.pending}`);
        lines.push("");
    });

    lines.push("=============================================================================");
    lines.push(`FULFILLED / DONE USERS (${doneRows.length})`);
    lines.push("=============================================================================");
    lines.push("");
    doneRows.forEach(r => {
        lines.push(`✅ ${r.name} [${r.status}]: Promised=${r.totalPromised} | Delivered=${r.delivered}`);
    });

    lines.push("");
    lines.push("=============================================================================");
    lines.push(`NO PAYMENT USERS (${noPaidRows.length})`);
    lines.push("=============================================================================");
    lines.push("");
    noPaidRows.forEach(r => {
        lines.push(`❌ ${r.name} [${r.status}]: 0 payments | Got=${r.delivered} leads`);
    });

    lines.push("");
    lines.push("=============================================================================");
    lines.push(`GRAND TOTAL PENDING LEADS: ${grandTotal.totalPending}`);
    lines.push("=============================================================================");

    const output = lines.join('\n');
    console.log(output);
    require('fs').writeFileSync('teamfire_full_audit.txt', output, 'utf8');
    console.log("\nSaved to teamfire_full_audit.txt");
}

main().catch(console.error);
