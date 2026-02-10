const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TEAM_CODE = 'TEAMFIRE';

async function verifyDeactivations() {
    console.log('--- VERIFYING 87 DEACTIVATIONS ---');

    // 1. Fetch Inactive Team Members
    const { data: users } = await supabase
        .from('users')
        .select('*')
        .eq('team_code', TEAM_CODE)
        .eq('is_active', false);

    if (!users) {
        console.log('No inactive users found.');
        return;
    }

    // 2. Fetch All Payments
    const { data: allPayments } = await supabase.from('payments').select('*').order('created_at', { ascending: false });

    const auditReport = [];

    for (const user of users) {
        // Search for ANY payment record ever
        const userPayments = allPayments.filter(p =>
            p.user_id === user.id ||
            p.payer_email === user.email ||
            (p.raw_payload && JSON.stringify(p.raw_payload).toLowerCase().includes(user.email.toLowerCase())) ||
            (p.raw_payload && JSON.stringify(p.raw_payload).toLowerCase().includes(user.name.toLowerCase()))
        );

        const lastPayment = userPayments[0];
        const lastDate = lastPayment ? lastPayment.created_at.split('T')[0] : 'NEVER';

        // Check if there's a payment in the last 30 days (not just Feb)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentPayment = userPayments.find(p => new Date(p.created_at) >= thirtyDaysAgo);

        auditReport.push({
            name: user.name,
            email: user.email,
            lastPayment: lastDate,
            hasPaymentLast30Days: !!recentPayment,
            recentPaymentDate: recentPayment ? recentPayment.created_at.split('T')[0] : '---',
            plan: user.plan_name
        });
    }

    console.log(`Total Inactive Audit: ${auditReport.length}`);

    // Show those who PAID in the last 30 days (potential false positives)
    const potentialErrors = auditReport.filter(r => r.hasPaymentLast30Days);
    console.log('\n--- USERS WITH PAYMENT IN LAST 30 DAYS (Potential Renewals) ---');
    console.table(potentialErrors);

    // Show sample of "NEVER PAID" users
    const neverPaid = auditReport.filter(r => r.lastPayment === 'NEVER');
    console.log(`\nUsers with NO payment record ever: ${neverPaid.length}`);
    console.table(neverPaid.slice(0, 10));

    // Show sample of "OLD PAYMENT" users (before Feb)
    const oldPaid = auditReport.filter(r => r.lastPayment !== 'NEVER' && !r.hasPaymentLast30Days);
    console.log(`\nUsers with payment BEFORE Jan 11 (Expired): ${oldPaid.length}`);
    console.table(oldPaid.slice(0, 10));
}

verifyDeactivations();
