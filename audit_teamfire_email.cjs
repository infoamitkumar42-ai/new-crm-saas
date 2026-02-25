const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Plan from AMOUNT
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
    // ===== STEP 1: INVESTIGATE KULWANT'S TWO ACCOUNTS =====
    console.log("===== INVESTIGATING KULWANT'S 2 ACCOUNTS =====\n");

    const { data: kulwants } = await supabase.from('users')
        .select('id, name, email, is_active, plan_name, team_code')
        .ilike('email', '%kulwantsingh%');

    for (const k of (kulwants || [])) {
        console.log(`Name: ${k.name} | Email: ${k.email} | Active: ${k.is_active} | Plan: ${k.plan_name} | Team: ${k.team_code}`);

        // Count leads
        const { count } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', k.id);
        console.log(`  Leads delivered: ${count}`);

        // Payments
        const { data: pays } = await supabase.from('payments')
            .select('amount, plan_name, status, created_at, razorpay_payment_id')
            .eq('user_id', k.id);
        console.log(`  Payments: ${(pays || []).length}`);
        (pays || []).forEach(p => {
            console.log(`    ₹${p.amount} ${p.plan_name} (${p.status}) on ${p.created_at?.split('T')[0]} [${p.razorpay_payment_id}]`);
        });
        console.log("");
    }

    // ===== STEP 2: INVESTIGATE SIMRAN =====
    console.log("===== INVESTIGATING SIMRAN ACCOUNTS =====\n");

    const { data: simrans } = await supabase.from('users')
        .select('id, name, email, is_active, plan_name, team_code')
        .eq('team_code', 'TEAMFIRE')
        .ilike('name', '%simran%');

    for (const s of (simrans || [])) {
        console.log(`Name: ${s.name} | Email: ${s.email} | Active: ${s.is_active} | Plan: ${s.plan_name}`);

        const { count } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', s.id);
        console.log(`  Leads delivered: ${count}`);

        const { data: pays } = await supabase.from('payments')
            .select('amount, plan_name, status, created_at, razorpay_payment_id')
            .eq('user_id', s.id)
            .eq('status', 'captured');
        console.log(`  Payments: ${(pays || []).length}`);
        (pays || []).forEach(p => {
            console.log(`    ₹${p.amount} ${p.plan_name} (${p.status}) on ${p.created_at?.split('T')[0]} [${p.razorpay_payment_id}]`);
        });
        console.log("");
    }

    // ===== STEP 3: FULL AUDIT WITH EMAIL =====
    console.log("\n===== GENERATING FULL AUDIT WITH EMAIL IDs =====\n");

    const { data: allUsers } = await supabase.from('users')
        .select('id, name, email, plan_name, is_active')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true)
        .order('name');

    const userIds = allUsers.map(u => u.id);

    // Fetch ALL captured payments (no dedup this time - we'll handle manually per user)
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

    // Per-user dedup: for each user, deduplicate by razorpay_payment_id
    const paysByUser = {};
    allPayments.forEach(p => {
        if (!paysByUser[p.user_id]) paysByUser[p.user_id] = { seen: new Set(), pays: [] };
        const rpId = p.razorpay_payment_id || `unique_${Math.random()}`;
        if (paysByUser[p.user_id].seen.has(rpId)) return;
        paysByUser[p.user_id].seen.add(rpId);
        paysByUser[p.user_id].pays.push(p);
    });

    let grandPending = 0;
    const rows = [];

    for (let u of allUsers) {
        const userPays = paysByUser[u.id] ? paysByUser[u.id].pays : [];
        if (userPays.length === 0) continue;

        let janPromised = 0, febPromised = 0;
        let janDetails = [], febDetails = [];

        userPays.forEach(p => {
            const month = p.created_at ? parseInt(p.created_at.split('-')[1]) : 0;
            const detected = getPlanFromAmount(p.amount, p.plan_name);
            if (month === 1) { janPromised += detected.leads; janDetails.push(`${detected.plan}(₹${p.amount})`); }
            else if (month === 2) { febPromised += detected.leads; febDetails.push(`${detected.plan}(₹${p.amount})`); }
        });

        const totalPromised = janPromised + febPromised;
        const { count: delivered } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id);

        const pending = Math.max(0, totalPromised - (delivered || 0));
        grandPending += pending;

        rows.push({
            name: u.name, email: u.email,
            janDetails: janDetails.join(', ') || '-', janPromised,
            febDetails: febDetails.join(', ') || '-', febPromised,
            totalPromised, delivered: delivered || 0, pending
        });
    }

    rows.sort((a, b) => b.pending - a.pending);

    const lines = [];
    lines.push("=============================================================================");
    lines.push("TEAMFIRE ACTIVE USERS - AUDIT WITH EMAIL (Feb 23, 2026)");
    lines.push("=============================================================================");
    lines.push("");

    const pendingRows = rows.filter(r => r.pending > 0);
    const doneRows = rows.filter(r => r.pending === 0);

    lines.push(`PENDING USERS (${pendingRows.length}):`);
    lines.push("-------------");
    pendingRows.forEach((r, i) => {
        lines.push(`${i + 1}. ${r.name} (${r.email})`);
        lines.push(`   JAN: ${r.janPromised > 0 ? r.janDetails + ' = ' + r.janPromised + ' leads' : '-'}`);
        lines.push(`   FEB: ${r.febPromised > 0 ? r.febDetails + ' = ' + r.febPromised + ' leads' : '-'}`);
        lines.push(`   Promised=${r.totalPromised} | Delivered=${r.delivered} | PENDING=${r.pending}`);
        lines.push("");
    });

    lines.push(`FULFILLED (${doneRows.length}):`);
    lines.push("-------------");
    doneRows.forEach(r => {
        lines.push(`✅ ${r.name} (${r.email}): Promised=${r.totalPromised} | Delivered=${r.delivered}`);
    });

    lines.push("");
    lines.push(`GRAND TOTAL PENDING: ${grandPending}`);
    lines.push("=============================================================================");

    const output = lines.join('\n');
    console.log(output);
    require('fs').writeFileSync('teamfire_email_audit.txt', output, 'utf8');
    console.log("\nSaved to teamfire_email_audit.txt");
}

main().catch(console.error);
