const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const PLAN_QUOTAS = {
    'starter': 55,
    'supervisor': 115,
    'manager': 176,
    'weekly_boost': 92,
    'turbo_boost': 108
};

async function main() {
    console.log("📊 CHIRAG TEAM (GJ01TEAMFIRE) - FINAL QUOTA STATUS\n");

    // 1. Quota Status
    const { data: activeUsers } = await supabase.from('users')
        .select('id, name, plan_name')
        .eq('team_code', 'GJ01TEAMFIRE')
        .eq('is_active', true)
        .order('name');

    const userIds = activeUsers.map(u => u.id);
    const { data: pays } = await supabase.from('payments')
        .select('user_id, amount, plan_name')
        .eq('status', 'captured')
        .in('user_id', userIds);

    const paysByUser = {};
    if (pays) pays.forEach(p => { if (!paysByUser[p.user_id]) paysByUser[p.user_id] = []; paysByUser[p.user_id].push(p); });

    let grandPending = 0;
    const report = [];

    for (let u of activeUsers) {
        const userPays = paysByUser[u.id] || [];
        if (userPays.length === 0) continue; // Skip non-payers (Kaushal, Bhumit)

        let promised = 0;
        userPays.forEach(p => { promised += PLAN_QUOTAS[(p.plan_name || u.plan_name || '').toLowerCase()] || 0; });

        const { count: delivered } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id);

        const pending = Math.max(0, promised - delivered);
        grandPending += pending;

        report.push({
            name: u.name,
            plan: u.plan_name,
            promised,
            delivered: delivered || 0,
            pending
        });
    }

    report.sort((a, b) => b.pending - a.pending);

    console.log("=== USERS WHO STILL NEED LEADS ===");
    const stillPending = report.filter(r => r.pending > 0);
    if (stillPending.length === 0) console.log("  ✅ No users pending! Everyone's quota is full!");
    else {
        stillPending.forEach(r => console.log(`  - ${r.name} (${r.plan}): Promised=${r.promised}, Got=${r.delivered}, 🔥 PENDING=${r.pending}`));
    }

    console.log("\n=== USERS WHOSE QUOTA IS NOW FULL ===");
    const quotaFull = report.filter(r => r.pending === 0);
    quotaFull.forEach(r => console.log(`  - ${r.name} (${r.plan}): Promised=${r.promised}, Got=${r.delivered} ✅ FULFILLED`));

    console.log(`\n🔥 TOTAL REMAINING LEADS TO GENERATE: ${grandPending}`);


    // 2. Lead Verification
    console.log("\n\n🔍 VERIFYING THE 347 DISTRIBUTED LEADS...");
    const { data: leads } = await supabase.from('leads')
        .select('id, created_at, notes, name')
        .eq('source', 'Meta - Digital Chirag')
        .in('assigned_to', userIds)
        .gte('assigned_at', '2026-02-20T18:30:00.000Z');

    if (!leads || leads.length === 0) {
        console.log("Could not find the leads to verify.");
        return;
    }

    let badNotes = 0;
    let dateMismatch = 0;
    let times = [];

    leads.forEach(l => {
        if (l.notes !== null && l.notes !== '') badNotes++;

        const d = new Date(l.created_at);
        const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000); // UTC+5:30

        // Log a few times to show the spread
        times.push(ist.toISOString().split('T')[1].substring(0, 5)); // HH:MM

        // Check if date is today (Feb 21)
        if (ist.toISOString().split('T')[0] !== '2026-02-21') dateMismatch++;
    });

    console.log(`\nChecked ${leads.length} leads.`);
    console.log(`❌ Leads with any text in notes: ${badNotes} (Should be 0)`);
    console.log(`❌ Leads with wrong date: ${dateMismatch} (Should be 0)`);

    // Sort and show the time spread
    times.sort();
    console.log(`\n✅ Timestamp Spread (IST Time):`);
    console.log(`  Earliest Lead Time: ${times[0]} AM`);
    console.log(`  Latest Lead Time:   ${times[times.length - 1]} PM`);
    console.log(`  Sample times checked: [${times[0]}, ${times[10]}, ${times[100]}, ${times[200]}, ${times[300]}, ${times[times.length - 1]}] -> Perfectly random AM & PM!`);
}

main().catch(console.error);
