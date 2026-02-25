const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://vewqzsqddgmkslnuctvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us');

function getRandomTime() {
    const base = new Date('2026-02-23T11:00:00.000Z'); // ~4:30 PM IST
    const offsetMs = Math.floor(Math.random() * 60 * 60 * 1000);
    return new Date(base.getTime() + offsetMs).toISOString();
}

async function main() {
    // 1. Get Rajwinder's leads
    const { data: raj } = await supabase.from('users').select('id').eq('email', 'rajwinder@gmail.com');
    const { data: rajLeads } = await supabase.from('leads').select('id').eq('assigned_to', raj[0].id);
    const allIds = (rajLeads || []).map(l => l.id);
    console.log('Rajwinder leads to revoke:', allIds.length);

    // 2. Unassign all from Rajwinder
    for (const lid of allIds) {
        await supabase.from('leads').update({ assigned_to: null, user_id: null }).eq('id', lid);
    }

    // 3. Get Kulwant
    const { data: kul } = await supabase.from('users').select('id, name, leads_today, daily_limit').eq('email', 'kulwantsinghdhaliwalsaab668@gmail.com');
    const kulId = kul[0].id;
    const origKulLimit = kul[0].daily_limit;
    const origKulToday = kul[0].leads_today;

    // Bump Kulwant's limit temporarily
    await supabase.from('users').update({ daily_limit: 999, leads_today: 0 }).eq('id', kulId);

    // Assign 1 lead to Kulwant
    const t1 = getRandomTime();
    await supabase.from('leads').update({
        assigned_to: kulId, user_id: kulId, assigned_at: t1, created_at: t1, notes: null, status: 'Assigned'
    }).eq('id', allIds[0]);
    console.log('Kulwant Singh: +1 lead');

    // Restore Kulwant's limits
    await supabase.from('users').update({ daily_limit: origKulLimit, leads_today: origKulToday + 1 }).eq('id', kulId);

    // 4. Get active TEAMFIRE paid users (excluding Kulwant)
    const { data: activeUsers } = await supabase.from('users').select('id, name, leads_today, daily_limit')
        .eq('team_code', 'TEAMFIRE').eq('is_active', true).neq('id', kulId).order('name');

    const paidUsers = [];
    for (const u of (activeUsers || [])) {
        const { data: p } = await supabase.from('payments').select('amount').eq('user_id', u.id).eq('status', 'captured');
        if (p && p.length > 0) paidUsers.push({ ...u, assigned: 0 });
    }
    console.log('Active paid TEAMFIRE users (excl Kulwant):', paidUsers.length);

    // 5. Temporarily bump all limits
    for (const u of paidUsers) {
        await supabase.from('users').update({ daily_limit: 999, leads_today: 0 }).eq('id', u.id);
    }

    // 6. Round-robin 19 leads
    const remaining = allIds.slice(1);
    let idx = 0;
    for (const lid of remaining) {
        const user = paidUsers[idx % paidUsers.length];
        const t = getRandomTime();
        await supabase.from('leads').update({
            assigned_to: user.id, user_id: user.id, assigned_at: t, created_at: t, notes: null, status: 'Assigned'
        }).eq('id', lid);
        user.assigned++;
        idx++;
    }

    // 7. Restore limits and sync leads_today
    for (const u of paidUsers) {
        const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id).gte('created_at', '2026-02-22T18:30:00Z');
        await supabase.from('users').update({ daily_limit: u.daily_limit, leads_today: count || 0 }).eq('id', u.id);
    }

    // 8. Report
    console.log('\n=== DISTRIBUTION ===');
    console.log('Kulwant Singh: +1');
    paidUsers.filter(u => u.assigned > 0).forEach(u => console.log(u.name + ': +' + u.assigned));
    console.log('\nTotal:', allIds.length, 'leads. DONE!');
}
main().catch(console.error);
