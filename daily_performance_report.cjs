const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://vewqzsqddgmkslnuctvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us');

(async () => {
    const today = '2026-02-14';
    console.log('═══════════════════════════════════════════════════');
    console.log('  📊 DAILY PERFORMANCE REPORT — Feb 14, 2026');
    console.log('═══════════════════════════════════════════════════');

    // 1. Total leads today
    const { data: allLeads } = await s
        .from('leads')
        .select('id, status, assigned_to, source, created_at')
        .gte('created_at', today);

    const statusBreak = {};
    allLeads.forEach(l => { statusBreak[l.status] = (statusBreak[l.status] || 0) + 1; });

    console.log('\n1️⃣  TOTAL LEADS TODAY:', allLeads.length);
    console.table(statusBreak);

    // 2. Queue check
    const queued = allLeads.filter(l => !l.assigned_to && ['Queued', 'New', 'Night_Backlog'].includes(l.status));
    console.log('\n2️⃣  QUEUE STATUS:', queued.length, 'leads unassigned');

    // 3. Team-wise breakdown
    const { data: users } = await s
        .from('users')
        .select('id, name, team_code, plan_name, daily_limit, daily_limit_override, leads_today')
        .eq('payment_status', 'active')
        .eq('is_active', true);

    const uMap = {};
    users.forEach(u => { uMap[u.id] = u; });

    const teams = {};
    users.forEach(u => {
        const team = u.team_code || 'NO_TEAM';
        if (!teams[team]) teams[team] = { members: 0, totalLimit: 0, assigned: 0, pending: 0 };
        const limit = u.daily_limit_override || u.daily_limit || 0;
        teams[team].members++;
        teams[team].totalLimit += limit;
        teams[team].assigned += (u.leads_today || 0);
        teams[team].pending += Math.max(0, limit - (u.leads_today || 0));
    });

    console.log('\n3️⃣  TEAM-WISE BREAKDOWN:');
    console.log('┌─────────────────┬─────────┬───────────┬──────────┬─────────┐');
    console.log('│ Team            │ Members │ DayLimit  │ Assigned │ PENDING │');
    console.log('├─────────────────┼─────────┼───────────┼──────────┼─────────┤');
    let gt = { m: 0, l: 0, a: 0, p: 0 };
    for (const [team, d] of Object.entries(teams).sort((a, b) => b[1].pending - a[1].pending)) {
        console.log('│ ' + team.padEnd(15) + ' │ ' + String(d.members).padStart(7) + ' │ ' + String(d.totalLimit).padStart(9) + ' │ ' + String(d.assigned).padStart(8) + ' │ ' + String(d.pending).padStart(7) + ' │');
        gt.m += d.members; gt.l += d.totalLimit; gt.a += d.assigned; gt.p += d.pending;
    }
    console.log('├─────────────────┼─────────┼───────────┼──────────┼─────────┤');
    console.log('│ ' + 'GRAND TOTAL'.padEnd(15) + ' │ ' + String(gt.m).padStart(7) + ' │ ' + String(gt.l).padStart(9) + ' │ ' + String(gt.a).padStart(8) + ' │ ' + String(gt.p).padStart(7) + ' │');
    console.log('└─────────────────┴─────────┴───────────┴──────────┴─────────┘');

    // 4. Balance Check — Tier-wise distribution within TEAMFIRE
    console.log('\n4️⃣  BALANCE CHECK (TEAMFIRE — Tier Priority):');
    const tfUsers = users.filter(u => u.team_code === 'TEAMFIRE' && (u.leads_today || 0) > 0);
    const tierGroups = { 'turbo_boost': [], 'weekly_boost': [], 'manager': [], 'supervisor': [], 'starter': [], 'none': [] };

    tfUsers.forEach(u => {
        const plan = u.plan_name || 'none';
        const bucket = Object.keys(tierGroups).find(k => plan.includes(k)) || 'none';
        tierGroups[bucket].push(u);
    });

    for (const [tier, members] of Object.entries(tierGroups)) {
        if (members.length === 0) continue;
        const avgLeads = (members.reduce((s, u) => s + (u.leads_today || 0), 0) / members.length).toFixed(1);
        const minLeads = Math.min(...members.map(u => u.leads_today || 0));
        const maxLeads = Math.max(...members.map(u => u.leads_today || 0));
        const avgLimit = (members.reduce((s, u) => s + (u.daily_limit_override || u.daily_limit || 0), 0) / members.length).toFixed(0);
        console.log('  ' + tier.toUpperCase().padEnd(14) + ' │ ' + String(members.length).padStart(3) + ' users │ Avg: ' + avgLeads + '/' + avgLimit + ' │ Range: ' + minLeads + '-' + maxLeads);
    }

    // 5. Over-limit check
    console.log('\n5️⃣  OVER-LIMIT CHECK:');
    let overCount = 0;
    users.forEach(u => {
        const limit = u.daily_limit_override || u.daily_limit || 0;
        if ((u.leads_today || 0) > limit && limit > 0) {
            overCount++;
            console.log('  ❌ ' + u.name + ' (' + u.plan_name + '): ' + u.leads_today + '/' + limit);
        }
    });
    if (overCount === 0) console.log('  ✅ No one exceeded their daily limit!');

    console.log('\n🚨 LEADS NEEDED TO COMPLETE QUOTA:', gt.p);
})();
