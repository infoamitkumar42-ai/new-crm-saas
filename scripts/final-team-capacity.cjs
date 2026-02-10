const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TEAM_CODE = 'TEAMFIRE';

async function generateFinalReport() {
    console.log('--- FINAL ACTIVE MEMBER REPORT (TEAMFIRE) ---');

    // 1. Fetch Active Members
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, name, email, daily_limit, plan_name, is_active')
        .eq('team_code', TEAM_CODE)
        .eq('is_active', true);

    if (uErr || !users) {
        console.error('Error fetching users:', uErr);
        return;
    }

    // 2. Fetch All Recorded Payments
    const { data: payments, error: pErr } = await supabase
        .from('payments')
        .select('user_id, payer_email, raw_payload');

    if (pErr) {
        console.error('Error fetching payments:', pErr);
        return;
    }

    const report = [];
    let totalDailyCapacity = 0;

    for (const user of users) {
        // Deep search payments for this specific user
        const userPayments = payments.filter(p =>
            p.user_id === user.id ||
            p.payer_email === user.email ||
            (p.raw_payload && JSON.stringify(p.raw_payload).toLowerCase().includes(user.email.toLowerCase())) ||
            (p.raw_payload && JSON.stringify(p.raw_payload).toLowerCase().includes(user.name.toLowerCase()))
        );

        totalDailyCapacity += (user.daily_limit || 0);

        report.push({
            name: user.name,
            email: user.email,
            plan: user.plan_name,
            paymentsFound: userPayments.length,
            dailyLimit: user.daily_limit || 0
        });
    }

    // Sort by Limit (desc)
    report.sort((a, b) => b.dailyLimit - a.dailyLimit);

    console.table(report);

    console.log(`\n--- SUMMARY ---`);
    console.log(`Total Active Paid Members: ${report.length}`);
    console.log(`Total Daily Leads Required (Capacity): ${totalDailyCapacity}`);
    console.log(`-------------------------------------------`);
}

generateFinalReport();
