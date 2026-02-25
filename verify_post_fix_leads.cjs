const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://vewqzsqddgmkslnuctvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us');

(async () => {
    // RPC was fixed at ~8:50 PM IST = 15:20 UTC
    const cutoff = '2026-02-13T15:20:00.000Z';

    const { data: leads } = await s
        .from('leads')
        .select('assigned_to, created_at')
        .gte('created_at', cutoff)
        .eq('status', 'Assigned')
        .order('created_at', { ascending: true });

    const { data: users } = await s
        .from('users')
        .select('id, name, plan_name, leads_today, daily_limit, daily_limit_override');

    const uMap = {};
    users.forEach(u => { uMap[u.id] = u; });

    console.log('LEADS ASSIGNED AFTER RPC FIX (Since ~8:50 PM IST):');
    console.log('Total:', leads.length);

    const receivers = {};
    leads.forEach(l => {
        if (!l.assigned_to) return;
        receivers[l.assigned_to] = (receivers[l.assigned_to] || 0) + 1;
    });

    const sorted = Object.entries(receivers).sort(([, a], [, b]) => b - a);
    let overLimit = 0;

    for (const [uid, count] of sorted) {
        const u = uMap[uid];
        if (!u) continue;
        const limit = u.daily_limit_override || u.daily_limit || 0;
        const isOver = u.leads_today > limit;
        if (isOver) overLimit++;
        const icon = isOver ? '❌' : '✅';
        console.log(`${icon} ${u.name} (${u.plan_name}) -> +${count} leads | Now: ${u.leads_today}/${limit}`);
    }

    console.log('');
    if (overLimit === 0) {
        console.log('✅ PERFECT! NO ONE EXCEEDED THEIR LIMIT!');
    } else {
        console.log('❌ ' + overLimit + ' users went over limit!');
    }
})();
