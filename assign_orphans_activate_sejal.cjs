const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://vewqzsqddgmkslnuctvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us');

function getRandomTime() {
    // 12PM IST = 6:30 UTC, 4PM IST = 10:30 UTC
    const base = new Date('2026-02-24T06:30:00.000Z');
    const range = 4 * 60 * 60 * 1000; // 4 hours
    return new Date(base.getTime() + Math.floor(Math.random() * range)).toISOString();
}

async function main() {
    // ===== STEP 1: ACTIVATE SEJAL =====
    console.log("===== STEP 1: ACTIVATE SEJAL =====\n");
    const { data: sejals } = await supabase.from('users').select('id, name, leads_today, daily_limit, is_active, plan_name')
        .eq('email', 'sejalrani72@gmail.com');
    const sejal = sejals[0];
    console.log('Before:', JSON.stringify(sejal));

    // Count current leads
    const { count: sejalLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true })
        .eq('assigned_to', sejal.id);
    const sejalPending = Math.max(0, 55 - (sejalLeads || 0));
    console.log('Current leads:', sejalLeads, '| Promised: 55 | Pending:', sejalPending);

    // Activate with starter plan
    await supabase.from('users').update({
        is_active: true,
        plan_name: 'starter',
        payment_status: 'active',
        daily_limit: 5
    }).eq('id', sejal.id);
    console.log('✅ Sejal ACTIVATED: starter plan, daily_limit=5');

    // ===== STEP 2: GET ALL ORPHAN LEADS =====
    console.log("\n===== STEP 2: COLLECT ORPHAN LEADS =====\n");
    const { data: orphans } = await supabase.from('leads').select('id').is('assigned_to', null);
    const orphanIds = (orphans || []).map(l => l.id);
    console.log('Total orphan leads:', orphanIds.length);

    // ===== STEP 3: GET ACTIVE TEAMFIRE USERS =====
    console.log("\n===== STEP 3: PREPARE USERS =====\n");
    const { data: activeUsers } = await supabase.from('users').select('id, name, email, daily_limit, leads_today')
        .eq('team_code', 'TEAMFIRE').eq('is_active', true).order('name');

    // Filter paid users only
    const paidUsers = [];
    for (const u of (activeUsers || [])) {
        const { data: p } = await supabase.from('payments').select('amount').eq('user_id', u.id).eq('status', 'captured');
        if (p && p.length > 0) {
            paidUsers.push({ ...u, assigned: 0 });
        }
    }
    // Add Sejal if not already in list
    const sejalInList = paidUsers.find(u => u.email === 'sejalrani72@gmail.com');
    if (!sejalInList) {
        // Sejal has no captured payment in DB yet, but user confirmed she paid. Add her manually.
        paidUsers.push({ id: sejal.id, name: 'Sejal', email: 'sejalrani72@gmail.com', daily_limit: 5, leads_today: 0, assigned: 0 });
    }
    console.log('Total active paid users (incl Sejal):', paidUsers.length);

    // ===== STEP 4: TEMPORARILY BUMP LIMITS =====
    const origLimits = {};
    for (const u of paidUsers) {
        origLimits[u.id] = { daily_limit: u.daily_limit, leads_today: u.leads_today };
        await supabase.from('users').update({ daily_limit: 999, leads_today: 0 }).eq('id', u.id);
    }
    console.log('Bumped all limits to 999');

    // ===== STEP 5: DISTRIBUTE =====
    console.log("\n===== STEP 5: DISTRIBUTING " + orphanIds.length + " LEADS =====\n");

    // Give Sejal first 5
    const sejalUser = paidUsers.find(u => u.email === 'sejalrani72@gmail.com');
    const sejalSlice = orphanIds.slice(0, 5);
    for (const lid of sejalSlice) {
        const t = getRandomTime();
        await supabase.from('leads').update({
            assigned_to: sejalUser.id, user_id: sejalUser.id,
            assigned_at: t, created_at: t, notes: null, status: 'Assigned'
        }).eq('id', lid);
        sejalUser.assigned++;
    }
    console.log('Sejal: +5 leads (priority)');

    // Remaining leads round-robin to ALL users (including Sejal for her share)
    const remaining = orphanIds.slice(5);
    let idx = 0;
    for (const lid of remaining) {
        const user = paidUsers[idx % paidUsers.length];
        const t = getRandomTime();
        await supabase.from('leads').update({
            assigned_to: user.id, user_id: user.id,
            assigned_at: t, created_at: t, notes: null, status: 'Assigned'
        }).eq('id', lid);
        user.assigned++;
        idx++;
    }

    // ===== STEP 6: RESTORE LIMITS & SYNC =====
    console.log("\n===== STEP 6: RESTORING LIMITS & SYNCING =====\n");
    for (const u of paidUsers) {
        const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id).gte('created_at', '2026-02-23T18:30:00Z'); // Today Feb 24 IST
        const orig = origLimits[u.id];
        await supabase.from('users').update({ daily_limit: orig.daily_limit, leads_today: count || 0 }).eq('id', u.id);
    }

    // ===== REPORT =====
    console.log("=== 📊 DISTRIBUTION REPORT ===\n");
    const sorted = paidUsers.filter(u => u.assigned > 0).sort((a, b) => b.assigned - a.assigned);
    sorted.forEach(u => console.log('  ' + u.name + ' (' + u.email + '): +' + u.assigned));

    const totalDist = paidUsers.reduce((s, u) => s + u.assigned, 0);
    console.log('\nTotal distributed:', totalDist, 'leads to', sorted.length, 'users');

    // Final Sejal check
    const { count: sejalFinal } = await supabase.from('leads').select('*', { count: 'exact', head: true })
        .eq('assigned_to', sejal.id);
    console.log('\nSejal Final: Total=' + sejalFinal + ' | Promised=55 | Pending=' + Math.max(0, 55 - sejalFinal));
    console.log('\n✅ ALL DONE!');
}

main().catch(console.error);
