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

async function reactivateVerified() {
    console.log('--- REACTIVATING 11 VERIFIED MEMBERS ---');

    // 1. Fetch Inactive Members
    const { data: users } = await supabase.from('users').select('*').eq('team_code', TEAM_CODE).eq('is_active', false);
    const { data: allPayments } = await supabase.from('payments').select('*').order('created_at', { ascending: false });

    if (!users) return;

    let activatedCount = 0;
    const activatedList = [];

    for (const user of users) {
        // Deep search payments
        const userPayments = allPayments.filter(p =>
            p.user_id === user.id ||
            p.payer_email === user.email ||
            (p.raw_payload && JSON.stringify(p.raw_payload).toLowerCase().includes(user.email.toLowerCase())) ||
            (p.raw_payload && JSON.stringify(p.raw_payload).toLowerCase().includes(user.name.toLowerCase()))
        );

        const lastPayment = userPayments[0];
        if (!lastPayment) continue;

        // Check if recent (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const isRecent = new Date(lastPayment.created_at) >= thirtyDaysAgo;

        if (!isRecent) continue;

        // Check Quota
        const baseLimit = PLAN_LIMITS[user.plan_name] || 0;
        const totalQuota = baseLimit * userPayments.length;

        const { count: leadsEver } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        const leadsCount = leadsEver || 0;
        const remaining = totalQuota - leadsCount;

        if (remaining > 0) {
            // REACTIVATE
            const { error } = await supabase.from('users').update({
                is_active: true,
                payment_status: 'active',
                daily_limit: 10, // Restore a reasonable daily limit
                valid_until: new Date(new Date(lastPayment.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }).eq('id', user.id);

            if (!error) {
                activatedCount++;
                activatedList.push({ name: user.name, remainingQuota: remaining });
                console.log(`✅ Reactivated: ${user.name} (${remaining} leads left)`);
            } else {
                console.error(`Error reactivating ${user.name}:`, error);
            }
        }
    }

    console.log(`\nSuccessfully reactivated ${activatedCount} members.`);
    console.table(activatedList);
}

reactivateVerified();
