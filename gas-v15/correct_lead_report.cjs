const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function generateCorrectReport() {
    const today = '2026-01-22';

    console.log('='.repeat(110));
    console.log('                         CORRECT LEAD REPORT - ' + today);
    console.log('='.repeat(110));

    // Get ALL active users
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, plan_name, valid_until, total_limit')
        .eq('is_active', true)
        .eq('payment_status', 'active')
        .order('valid_until', { ascending: true });

    if (error) { console.error(error); return; }

    const stopToday = [];
    const activeUsers = [];

    for (const user of users) {
        // Count leads from BOTH columns
        const { count: c1 } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
        const { count: c2 } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('assigned_to', user.id);

        const totalLeads = (c1 || 0) + (c2 || 0);
        const validUntil = user.valid_until ? user.valid_until.split('T')[0] : null;
        const limit = user.total_limit || 0;
        const pending = limit - totalLeads;

        const data = {
            name: user.name,
            email: user.email,
            plan: user.plan_name || 'none',
            validUntil: validUntil,
            totalLeads: totalLeads,
            limit: limit,
            pending: pending,
            status: pending > 0 ? pending + ' LEFT' : (pending < 0 ? Math.abs(pending) + ' EXTRA' : 'EXACT')
        };

        if (!validUntil || validUntil <= today) {
            stopToday.push(data);
        } else {
            activeUsers.push(data);
        }
    }

    // Print STOP TODAY
    console.log('\n🛑 STOP TODAY (Expired/Expiring Today):');
    console.log('-'.repeat(110));
    console.log('NAME'.padEnd(22) + 'PLAN'.padEnd(15) + 'VALID UNTIL'.padEnd(14) + 'LEADS'.padEnd(8) + 'LIMIT'.padEnd(8) + 'STATUS');
    console.log('-'.repeat(110));
    stopToday.forEach(u => {
        console.log(
            u.name.padEnd(22).substring(0, 22) +
            u.plan.padEnd(15).substring(0, 15) +
            (u.validUntil || 'N/A').padEnd(14) +
            String(u.totalLeads).padEnd(8) +
            String(u.limit).padEnd(8) +
            u.status
        );
    });

    // Print ACTIVE
    console.log('\n\n✅ ACTIVE USERS (Valid beyond today):');
    console.log('-'.repeat(110));
    console.log('NAME'.padEnd(22) + 'PLAN'.padEnd(15) + 'VALID UNTIL'.padEnd(14) + 'LEADS'.padEnd(8) + 'LIMIT'.padEnd(8) + 'STATUS');
    console.log('-'.repeat(110));
    activeUsers.forEach(u => {
        console.log(
            u.name.padEnd(22).substring(0, 22) +
            u.plan.padEnd(15).substring(0, 15) +
            (u.validUntil || 'N/A').padEnd(14) +
            String(u.totalLeads).padEnd(8) +
            String(u.limit).padEnd(8) +
            u.status
        );
    });

    console.log('\n' + '='.repeat(110));
    console.log('SUMMARY: Total Users=' + users.length + ' | Stop Today=' + stopToday.length + ' | Active=' + activeUsers.length);
    console.log('='.repeat(110));
}

generateCorrectReport();
