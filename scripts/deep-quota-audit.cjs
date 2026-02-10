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

async function deepQuotaAudit() {
    console.log('--- DEEP BULK PAYMENT & QUOTA AUDIT (33 EXPIRED MEMBERS) ---');

    // 1. Fetch Inactive Users from TEAMFIRE
    const { data: users } = await supabase.from('users').select('*').eq('team_code', TEAM_CODE).eq('is_active', false);
    const { data: allPayments } = await supabase.from('payments').select('*').order('created_at', { ascending: false });

    if (!users) return;

    const report = [];

    for (const user of users) {
        // Search for ALL payments (Deep search)
        const userPayments = allPayments.filter(p =>
            p.user_id === user.id ||
            p.payer_email === user.email ||
            (p.raw_payload && JSON.stringify(p.raw_payload).toLowerCase().includes(user.email.toLowerCase())) ||
            (p.raw_payload && JSON.stringify(p.raw_payload).toLowerCase().includes(user.name.toLowerCase()))
        );

        // If no payments ever, skip (they are in the 37 NEVER PAID category)
        if (userPayments.length === 0) continue;

        // Separate logically: if they have payment in last 30 days, they were already checked.
        // We are looking for those whose LAST payment was > 30 days ago.
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const lastPaymentDate = new Date(userPayments[0].created_at);

        if (lastPaymentDate >= thirtyDaysAgo) continue; // Skip recent (already reactivated or checked)

        // Calculate Quota based on TOTAL payments found
        const baseLimit = PLAN_LIMITS[user.plan_name] || 0;
        const totalPayments = userPayments.length;
        const totalQuota = baseLimit * totalPayments;

        // Fetch ALL leads assigned to this user ever
        const { count: leadsEver } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        const leadsCount = leadsEver || 0;
        const remaining = totalQuota - leadsCount;

        report.push({
            name: user.name,
            email: user.email,
            plan: user.plan_name,
            totalPayments,
            baseLimit,
            totalQuota,
            totalLeadsReceived: leadsCount,
            leadsLeft: remaining,
            lastPaymentDate: userPayments[0].created_at.split('T')[0],
            recommendation: remaining > 0 ? 'REACTIVATE' : 'STAY_STOP'
        });
    }

    console.table(report.sort((a, b) => b.leadsLeft - a.leadsLeft));

    const reactiveBatch = report.filter(r => r.recommendation === 'REACTIVATE');
    console.log(`\nFound ${reactiveBatch.length} users with old payments but REMAINING leads quota.`);
}

deepQuotaAudit();
