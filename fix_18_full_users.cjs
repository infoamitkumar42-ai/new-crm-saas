const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://vewqzsqddgmkslnuctvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us');

function getPlan(amt, hint) {
    amt = Number(amt);
    if (amt === 999) return { p: 'starter', l: 55 };
    if (amt === 1999) return (hint || '').toLowerCase().includes('weekly') || (hint || '').toLowerCase().includes('boost') ? { p: 'weekly', l: 92 } : { p: 'supervisor', l: 115 };
    if (amt === 2999) return { p: 'manager', l: 176 };
    if (amt === 2499) return { p: 'turbo', l: 108 };
    return { p: 'unknown', l: 0 };
}

function getRandomTime() {
    // 4PM to 6PM IST today
    const base = new Date('2026-02-24T10:30:00.000Z');
    const range = 2 * 60 * 60 * 1000;
    return new Date(base.getTime() + Math.floor(Math.random() * range)).toISOString();
}

async function main() {
    console.log("=== STEP 1: IDENTIFY USER STATUS ===");
    const { data: activeUsers } = await supabase.from('users')
        .select('id, name, email, daily_limit')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true)
        .order('name');

    const fullUsers = [];
    const pendingUsers = [];

    for (const u of (activeUsers || [])) {
        let { data: pays } = await supabase.from('payments')
            .select('amount, plan_name, razorpay_payment_id')
            .eq('user_id', u.id)
            .eq('status', 'captured');

        if (u.email === 'sejalrani72@gmail.com' && (!pays || pays.length === 0)) {
            pays = [{ amount: 999, plan_name: 'starter', razorpay_payment_id: 'manual_sejal' }];
        }
        if (!pays || pays.length === 0) continue;

        const seen = new Set();
        let promised = 0;
        for (const p of pays) {
            const rp = p.razorpay_payment_id || Math.random();
            if (seen.has(rp)) continue;
            seen.add(rp);
            promised += getPlan(p.amount, p.plan_name).l;
        }

        const { count: delivered } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id);

        const pending = Math.max(0, promised - (delivered || 0));

        if (pending === 0 && promised > 0) {
            fullUsers.push(u);
        } else {
            pendingUsers.push({ ...u, pending_count: pending, assigned: 0 });
        }
    }

    console.log(`Identified ${fullUsers.length} FULL users and ${pendingUsers.length} PENDING users.`);

    console.log("\n=== STEP 2: REVOKE LEADS FROM FULL USERS & STOP THEM ===");
    let leadsToRedistribute = [];

    for (const u of fullUsers) {
        // Find leads assigned TODAY
        const { data: todayLeads } = await supabase.from('leads')
            .select('id')
            .eq('assigned_to', u.id)
            .gte('assigned_at', '2026-02-23T18:30:00Z'); // From 24th Feb IST

        if (todayLeads && todayLeads.length > 0) {
            const ids = todayLeads.map(l => l.id);
            leadsToRedistribute = leadsToRedistribute.concat(ids);

            // Unassign
            for (const lid of ids) {
                await supabase.from('leads').update({ assigned_to: null, user_id: null }).eq('id', lid);
            }
            console.log(`  Revoked ${ids.length} leads from ${u.name}`);
        }

        // STOP the user permanently
        await supabase.from('users').update({ is_active: false, leads_today: 0 }).eq('id', u.id);
        console.log(`  🛑 STOPPED: ${u.name} (${u.email})`);
    }

    console.log(`\nTotal leads collected for redistribution: ${leadsToRedistribute.length}`);
    if (leadsToRedistribute.length === 0) {
        console.log("No leads to redistribute. Exiting.");
        return;
    }

    console.log("\n=== STEP 3: REDISTRIBUTE ROUND ROBIN ===");
    // Temporarily bump limits for pending users to avoid trigger blocks
    const origLimits = {};
    for (const u of pendingUsers) {
        origLimits[u.id] = u.daily_limit;
        await supabase.from('users').update({ daily_limit: 999, leads_today: 0 }).eq('id', u.id);
    }
    console.log("Bumped limits for pending users.");

    let idx = 0;
    for (const lid of leadsToRedistribute) {
        const user = pendingUsers[idx % pendingUsers.length];
        const t = getRandomTime();
        await supabase.from('leads').update({
            assigned_to: user.id, user_id: user.id,
            assigned_at: t, created_at: t, notes: null, status: 'Assigned'
        }).eq('id', lid);
        user.assigned++;
        idx++;
    }

    console.log("\n=== STEP 4: RESTORE LIMITS & SYNC ===");
    for (const u of pendingUsers) {
        const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id).gte('created_at', '2026-02-23T18:30:00Z');
        await supabase.from('users').update({ daily_limit: origLimits[u.id], leads_today: count || 0 }).eq('id', u.id);
    }
    console.log("Restored limits and synced leads_today.");

    console.log("\n=== 📊 DISTRIBUTION REPORT ===");
    const sorted = pendingUsers.filter(u => u.assigned > 0).sort((a, b) => b.assigned - a.assigned);
    sorted.forEach(u => console.log(`  ${u.name}: +${u.assigned} leads (Pending was ${u.pending_count})`));

    console.log("\n✅ ALL DONE!");
}

main().catch(console.error);
