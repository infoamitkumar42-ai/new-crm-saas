const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

// Official Plan Limits (Total + Replacement)
const PLAN_LIMITS = {
    'starter': { total: 50, replacement: 5, promised: 55 },
    'supervisor': { total: 105, replacement: 10, promised: 115 },
    'manager': { total: 160, replacement: 16, promised: 176 },
    'weekly_boost': { total: 84, replacement: 8, promised: 92 },
    'turbo_boost': { total: 98, replacement: 10, promised: 108 }
};

async function verifyChurnedUsers() {
    console.log("🔍 VERIFYING 45 STOPPED USERS (Detailed Check)\n");

    // Fetch stopped users
    const { data: users } = await supabase
        .from('users')
        .select('id, name, plan_name, is_active, total_leads_received, total_leads_promised')
        .eq('is_active', false)
        .neq('plan_name', 'none')
        .order('name', { ascending: true });

    // Fetch all payments
    const { data: payments } = await supabase
        .from('payments')
        .select('user_id, amount, created_at')
        .eq('status', 'captured')
        .order('created_at', { ascending: true });

    // Map payments
    const paymentMap = new Map();
    (payments || []).forEach(p => {
        if (!paymentMap.has(p.user_id)) paymentMap.set(p.user_id, []);
        paymentMap.get(p.user_id).push(p);
    });

    console.log(`| #  | Name                   | Plan         | Received | Promised | Pending | Payments |`);
    console.log(`|----|------------------------|--------------|----------|----------|---------|----------|`);

    let onePayment = 0;
    let twoPayments = 0;
    let morePayments = 0;
    let totalPending = 0;

    users.forEach((u, i) => {
        const userPayments = paymentMap.get(u.id) || [];
        const payCount = userPayments.length;
        const limit = PLAN_LIMITS[u.plan_name]?.promised || u.total_leads_promised || 55;
        const received = u.total_leads_received || 0;
        const pending = limit - received;

        totalPending += pending > 0 ? pending : 0;

        if (payCount === 1) onePayment++;
        else if (payCount === 2) twoPayments++;
        else if (payCount > 2) morePayments++;

        const payStatus = payCount === 0 ? 'Manual' : `${payCount}x`;

        console.log(`| ${String(i + 1).padEnd(2)} | ${(u.name || 'Unknown').padEnd(22)} | ${(u.plan_name || '-').padEnd(12)} | ${String(received).padEnd(8)} | ${String(limit).padEnd(8)} | ${String(pending).padEnd(7)} | ${payStatus.padEnd(8)} |`);
    });

    console.log(`\n==========================================================`);
    console.log(`📊 VERIFICATION SUMMARY`);
    console.log(`==========================================================`);
    console.log(`Total Stopped Users:        ${users.length}`);
    console.log(`With 1 Payment Only:        ${onePayment}`);
    console.log(`With 2 Payments:            ${twoPayments}`);
    console.log(`With 3+ Payments:           ${morePayments}`);
    console.log(`Manual Activation:          ${users.length - onePayment - twoPayments - morePayments}`);
    console.log(`─────────────────────────────────────────────────────────`);
    console.log(`Total Pending Leads:        ${totalPending}`);
}

verifyChurnedUsers();
