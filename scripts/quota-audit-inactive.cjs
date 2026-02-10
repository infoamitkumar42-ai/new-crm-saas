const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TEAM_CODE = 'TEAMFIRE';
const PLAN_LIMITS = {
    'starter': 55,
    'supervisor': 115,
    'manager': 176,
    'weekly_boost': 92,
    'turbo_boost': 108
};

async function quotaAudit() {
    console.log('--- DETAILED QUOTA AUDIT (87 INACTIVE MEMBERS) ---');

    // 1. Fetch Inactive Users
    const { data: users } = await supabase.from('users').select('*').eq('team_code', TEAM_CODE).eq('is_active', false);
    const { data: allPayments } = await supabase.from('payments').select('*').order('created_at', { ascending: false });

    const report = [];

    for (const user of users) {
        // Find all payments
        const userPayments = allPayments.filter(p =>
            p.user_id === user.id ||
            p.payer_email === user.email ||
            (p.raw_payload && JSON.stringify(p.raw_payload).toLowerCase().includes(user.email.toLowerCase())) ||
            (p.raw_payload && JSON.stringify(p.raw_payload).toLowerCase().includes(user.name.toLowerCase()))
        );

        const paymentCount = userPayments.length;
        const lastPayment = userPayments[0];
        const lastDate = lastPayment ? lastPayment.created_at.split('T')[0] : 'NEVER';

        // Calculate Quota
        const baseLimit = PLAN_LIMITS[user.plan_name] || 0;
        const totalQuota = baseLimit * (paymentCount || 0);

        // Fetch Total Leads Ever
        const { count: leadsEver } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        const leadsCount = leadsEver || 0;
        const remaining = totalQuota - leadsCount;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const isRecent = lastPayment && new Date(lastPayment.created_at) >= thirtyDaysAgo;

        report.push({
            name: user.name,
            email: user.email,
            plan: user.plan_name,
            lastPayDate: lastDate,
            payments: paymentCount,
            quota: totalQuota,
            leadsRecieved: leadsCount,
            leadsRemaining: remaining,
            isRecent: isRecent ? 'YES (Jan/Feb)' : (lastDate === 'NEVER' ? 'NO' : 'EXPIRED'),
            recommendation: (remaining > 0 && isRecent) ? 'REACTIVE' : 'STAY_STOP'
        });
    }

    console.table(report.sort((a, b) => (a.isRecent === b.isRecent) ? (b.leadsRemaining - a.leadsRemaining) : (a.isRecent === 'YES (Jan/Feb)' ? -1 : 1)));

    const reactiveCount = report.filter(r => r.recommendation === 'REACTIVE').length;
    console.log(`\nRecommendation: Reactive ${reactiveCount} users who have quota and recent payments.`);
}

quotaAudit();
