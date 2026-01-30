const { createClient } = require('@supabase/supabase-js');

// HARDCODED CREDENTIALS
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PLAN_LIMITS = {
    'starter': 55,
    'supervisor': 115,
    'manager': 176,
    'weekly_boost': 92,
    'turbo_boost': 108
};

async function auditPayments() {
    console.log('📊 GENERATING PAYMENT AUDIT REPORT...\n');

    // 1. Fetch Users
    const { data: users } = await supabase.from('users').select('id, name, email, plan_name, is_active, daily_limit');

    // 2. Fetch All Payments
    // We want captured payments
    // We also want to see recent payments (last 3 days)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: payments } = await supabase.from('payments')
        .select('id, user_id, amount, status, created_at')
        .eq('status', 'captured');

    // Map payments to users
    const userPayments = {};
    const recentPayments = [];

    payments.forEach(p => {
        if (!userPayments[p.user_id]) userPayments[p.user_id] = [];
        userPayments[p.user_id].push(p);

        if (new Date(p.created_at) > threeDaysAgo) {
            recentPayments.push(p);
        }
    });

    // Group Users by Pay Count
    const groups = { 1: [], 2: [], 3: [], 0: [] };

    for (const u of users) {
        if (!u.plan_name || u.plan_name === 'none') continue;

        const pays = userPayments[u.id] || [];
        const count = pays.length;

        const info = {
            name: u.name,
            email: u.email,
            plan: u.plan_name,
            status: u.is_active ? 'Active' : 'Stopped',
            limit: u.daily_limit,
            payCount: count
        };

        // Quota usage
        const { count: leads } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', u.id);
        info.used = leads || 0;

        const base = PLAN_LIMITS[u.plan_name.toLowerCase()] || 0;
        info.quota = base * count;
        info.remaining = info.quota - info.used;

        if (count === 1) groups[1].push(info);
        else if (count === 2) groups[2].push(info);
        else if (count > 2) groups[3].push(info);
        else groups[0].push(info);
    }

    console.log(`=== 1 PAYMENT USERS (Total: ${groups[1].length}) ===`);
    // Too many to list? Only list if stuck?
    // User asked "unka 1 payments check kro". I'll scan for issues.
    let issues1 = 0;
    groups[1].forEach(u => {
        if (u.remaining > 0 && (u.status === 'Stopped' || u.limit === 0)) {
            console.log(`⚠️ STUCK (1 Pay): ${u.name} - ${u.remaining} Leads Pending`);
            issues1++;
        }
    });
    if (issues1 === 0) console.log('✅ All 1-Pay Users look healthy (Active or correctly stopped).');

    console.log(`\n=== 2 PAYMENT USERS (Total: ${groups[2].length}) ===`);
    groups[2].forEach(u => {
        const flag = (u.remaining > 0 && (u.status === 'Stopped' || u.limit === 0)) ? '⚠️ STUCK' : '✅ OK';
        console.log(`${flag} | ${u.name} | Used: ${u.used}/${u.quota} | Status: ${u.status}`);
    });

    console.log(`\n=== 3+ PAYMENT USERS (Total: ${groups[3].length}) ===`);
    groups[3].forEach(u => {
        const flag = (u.remaining > 0 && (u.status === 'Stopped' || u.limit === 0)) ? '⚠️ STUCK' : '✅ OK';
        console.log(`${flag} | ${u.name} (${u.payCount} Pays) | Used: ${u.used}/${u.quota}`);
    });

    console.log(`\n=== RECENT PAYMENTS (Last 72h) ===`);
    for (const p of recentPayments) {
        const u = users.find(x => x.id === p.user_id);
        if (u) console.log(`- ${u.name} paid ${p.amount} on ${new Date(p.created_at).toLocaleString()}`);
    }
}

auditPayments();
