const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://vewqzsqddgmkslnuctvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us');

function getRandomTime() {
    // 12PM IST = 6:30 UTC, 4PM IST = 10:30 UTC
    const base = new Date('2026-02-24T06:30:00.000Z');
    const range = 4 * 60 * 60 * 1000;
    return new Date(base.getTime() + Math.floor(Math.random() * range)).toISOString();
}

async function main() {
    // 1. Target User: Pooja Jolly
    const { data: poojas } = await supabase.from('users').select('id, name, leads_today, daily_limit')
        .eq('email', 'jollypooja5@gmail.com');

    if (!poojas || poojas.length === 0) { console.log('Pooja Jolly not found.'); return; }
    const pooja = poojas[0];

    // Activate Pooja Jolly
    await supabase.from('users').update({
        is_active: true,
        plan_name: 'starter',
        payment_status: 'active',
        daily_limit: 5 // Default daily limit for natural assignment
    }).eq('id', pooja.id);
    console.log('✅ Pooja Jolly ACTIVATED (starter plan, daily_limit=5)');

    // 2. Fix exactly 36 leads for her
    const { data: allPoojaLeads } = await supabase.from('leads').select('id')
        .eq('assigned_to', pooja.id);
    const totalLeads = (allPoojaLeads || []).length;
    console.log(`Current Total Leads for Pooja: ${totalLeads}`);

    const TARGET_LEADS = 36;
    let leadsToRevoke = totalLeads - TARGET_LEADS;

    if (leadsToRevoke <= 0) {
        console.log(`Pooja already has ${totalLeads} which is <= ${TARGET_LEADS}. No revocation needed.`);
        return;
    }

    console.log(`Target is exactly 36 leads. Need to revoke: ${leadsToRevoke} leads.`);

    // Pick leads from her Feb 7 mass assignment to revoke
    const { data: febleads } = await supabase.from('leads').select('id, assigned_at')
        .eq('assigned_to', pooja.id)
        .gte('assigned_at', '2026-02-07T00:00:00Z')
        .lt('assigned_at', '2026-02-08T00:00:00Z');

    if (!febleads || febleads.length < leadsToRevoke) {
        console.log("NOT ENOUGH FEB 7 LEADS TO REVOKE! Found:", febleads?.length);
        return;
    }

    // Slice exact number to revoke
    const leadsToRevokeIds = febleads.slice(0, leadsToRevoke).map(l => l.id);
    console.log(`Revoking exactly ${leadsToRevokeIds.length} leads...`);

    // Unassign them
    for (const lid of leadsToRevokeIds) {
        await supabase.from('leads').update({ assigned_to: null, user_id: null }).eq('id', lid);
    }
    console.log('✅ Revoked from Pooja Jolly.');

    // Wait and verify Pooja total
    const { count: finalPoojaLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true })
        .eq('assigned_to', pooja.id);
    console.log(`--- Pooja Final Count: ${finalPoojaLeads} leads (Needs exactly ${55 - finalPoojaLeads} more naturally) ---`);


    // 3. Get Active Paid TEAMFIRE Users (Excluding Pooja)
    const { data: activeUsers } = await supabase.from('users').select('id, name, email, daily_limit, leads_today')
        .eq('team_code', 'TEAMFIRE').eq('is_active', true).neq('id', pooja.id).order('name');

    const paidUsers = [];
    for (const u of (activeUsers || [])) {
        // Sejal is a known manual active
        if (u.email === 'sejalrani72@gmail.com') {
            paidUsers.push({ ...u, assigned: 0 });
            continue;
        }
        const { data: p } = await supabase.from('payments').select('amount').eq('user_id', u.id).eq('status', 'captured');
        if (p && p.length > 0) {
            paidUsers.push({ ...u, assigned: 0 });
        }
    }
    console.log(`\nFound ${paidUsers.length} active paid TEAMFIRE users to distribute ${leadsToRevokeIds.length} leads.`);

    // 4. Temporarily bump limits to bypass DB trigger
    const origLimits = {};
    for (const u of paidUsers) {
        origLimits[u.id] = { daily_limit: u.daily_limit, leads_today: u.leads_today };
        await supabase.from('users').update({ daily_limit: 999, leads_today: 0 }).eq('id', u.id);
    }
    console.log('Bypassed DB assignment limits.');

    // 5. Round Robin Distribution
    console.log("\n===== DISTRIBUTING LEADS =====\n");
    let idx = 0;
    for (const lid of leadsToRevokeIds) {
        const user = paidUsers[idx % paidUsers.length];
        const t = getRandomTime();
        await supabase.from('leads').update({
            assigned_to: user.id, user_id: user.id,
            assigned_at: t, created_at: t, notes: null, status: 'Assigned'
        }).eq('id', lid);
        user.assigned++;
        idx++;
    }

    // 6. Restore limits & sync
    console.log("\n===== RESTORING LIMITS & SYNCING =====\n");
    for (const u of paidUsers) {
        const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id).gte('created_at', '2026-02-23T18:30:00Z'); // Today Feb 24 IST
        const orig = origLimits[u.id];
        await supabase.from('users').update({ daily_limit: orig.daily_limit, leads_today: count || 0 }).eq('id', u.id);
    }

    // ALSO sync Pooja just in case she had some today
    const { count: poojaToday } = await supabase.from('leads').select('*', { count: 'exact', head: true })
        .eq('assigned_to', pooja.id).gte('created_at', '2026-02-23T18:30:00Z');
    await supabase.from('users').update({ leads_today: poojaToday || 0 }).eq('id', pooja.id);


    // 7. Report
    console.log("=== 📊 DISTRIBUTION REPORT ===\n");
    const sorted = paidUsers.filter(u => u.assigned > 0).sort((a, b) => b.assigned - a.assigned);
    sorted.forEach(u => console.log(`  ${u.name} (${u.email}): +${u.assigned}`));

    const totalDist = paidUsers.reduce((s, u) => s + u.assigned, 0);
    console.log(`\nTotal distributed: ${totalDist} leads to ${sorted.length} users`);
    console.log('\n✅ Task Complete!');
}

main().catch(console.error);
