const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function finalReport() {
    const today = '2026-01-22';

    console.log('='.repeat(90));
    console.log('           FINAL CORRECT REPORT - ' + today + ' (Dashboard Matching)');
    console.log('='.repeat(90));

    const { data: users } = await supabase
        .from('users')
        .select('id, name, email, plan_name, valid_until, total_limit')
        .eq('is_active', true)
        .eq('payment_status', 'active')
        .order('valid_until', { ascending: true });

    const stopToday = [];
    const activeUsers = [];

    for (const user of users) {
        const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

        const totalLeads = count || 0;
        const validUntil = user.valid_until ? user.valid_until.split('T')[0] : null;
        const limit = user.total_limit || 0;
        const pending = limit > 0 ? limit - totalLeads : 0;

        let status = '';
        if (limit === 0) {
            status = totalLeads + ' (No Limit Set)';
        } else if (pending > 0) {
            status = pending + ' LEFT';
        } else if (pending < 0) {
            status = Math.abs(pending) + ' EXTRA';
        } else {
            status = 'COMPLETE';
        }

        const data = {
            name: user.name,
            plan: user.plan_name || 'none',
            validUntil: validUntil,
            totalLeads: totalLeads,
            limit: limit,
            status: status
        };

        if (!validUntil || validUntil <= today) {
            stopToday.push(data);
        } else {
            activeUsers.push(data);
        }
    }

    // STOP TODAY
    console.log('\n🛑 AAJ STOP KARO (Expired/Expiring Today):');
    console.log('-'.repeat(90));
    console.log('NAME'.padEnd(22) + 'PLAN'.padEnd(15) + 'VALID UNTIL'.padEnd(14) + 'LEADS'.padEnd(8) + 'LIMIT'.padEnd(8) + 'STATUS');
    console.log('-'.repeat(90));
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

    // ACTIVE
    console.log('\n\n✅ ACTIVE USERS (Kal+ Valid):');
    console.log('-'.repeat(90));
    console.log('NAME'.padEnd(22) + 'PLAN'.padEnd(15) + 'VALID UNTIL'.padEnd(14) + 'LEADS'.padEnd(8) + 'LIMIT'.padEnd(8) + 'STATUS');
    console.log('-'.repeat(90));
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

    console.log('\n' + '='.repeat(90));
    console.log('Total: ' + users.length + ' | Stop Today: ' + stopToday.length + ' | Active: ' + activeUsers.length);
    console.log('='.repeat(90));
}

finalReport();
