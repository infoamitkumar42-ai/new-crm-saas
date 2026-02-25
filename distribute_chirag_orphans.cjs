const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const PLAN_QUOTAS = { 'starter': 55, 'supervisor': 115, 'manager': 176, 'weekly_boost': 92, 'turbo_boost': 108 };

function randomTodayTimestamp() {
    // 6:00 AM IST = Today 00:30 UTC, 5:00 PM IST = Today 11:30 UTC
    // Use Feb 21 as "today"
    const startUTC = new Date('2026-02-21T00:30:00.000Z').getTime();
    const endUTC = new Date('2026-02-21T11:30:00.000Z').getTime();
    const randomMs = startUTC + Math.random() * (endUTC - startUTC);
    return new Date(randomMs).toISOString();
}

async function main() {
    console.log("🚀 Distributing 347 Orphan Leads to Chirag Team pending users...\n");

    // 1. Get the 10 pending users (we calculate this dynamically again just to be sure)
    const { data: activeUsers } = await supabase.from('users')
        .select('id, name, plan_name, is_active, leads_today')
        .eq('team_code', 'GJ01TEAMFIRE')
        .eq('is_active', true);

    const userIds = activeUsers.map(u => u.id);
    const { data: pays } = await supabase.from('payments')
        .select('user_id, plan_name').eq('status', 'captured').in('user_id', userIds);

    const paysByUser = {};
    if (pays) pays.forEach(p => { if (!paysByUser[p.user_id]) paysByUser[p.user_id] = []; paysByUser[p.user_id].push(p); });

    const pendingUsers = [];
    let totalPendingAll = 0;

    for (let u of activeUsers) {
        const userPays = paysByUser[u.id] || [];
        if (userPays.length === 0) continue; // Skip non-payers

        let promised = 0;
        userPays.forEach(p => { promised += PLAN_QUOTAS[(p.plan_name || u.plan_name || '').toLowerCase()] || 0; });

        const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('assigned_to', u.id);
        const delivered = count || 0;
        const pending = Math.max(0, promised - delivered);

        if (pending > 0) {
            pendingUsers.push({ id: u.id, name: u.name, plan: u.plan_name, pending, leads_today: u.leads_today || 0 });
            totalPendingAll += pending;
        }
    }

    console.log(`Found ${pendingUsers.length} users with total ${totalPendingAll} pending leads.`);

    // 2. Fetch the 347 orphan leads
    const { data: orphanLeads } = await supabase.from('leads')
        .select('id, name')
        .eq('source', 'Meta - Digital Chirag')
        .is('assigned_to', null)
        .order('created_at', { ascending: true });

    if (!orphanLeads || orphanLeads.length === 0) {
        console.log("No orphan leads found!"); return;
    }

    console.log(`Fetched ${orphanLeads.length} orphan leads to distribute.`);

    // 3. Distribute proportionally
    // Create a pool where a user appears 'pending' times
    let distributionPool = [];
    for (let u of pendingUsers) {
        for (let i = 0; i < u.pending; i++) {
            distributionPool.push(u);
        }
    }
    // Shuffle pool heavily
    for (let i = distributionPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [distributionPool[i], distributionPool[j]] = [distributionPool[j], distributionPool[i]];
    }

    let batchUpdates = [];
    const assignedCounts = {};

    for (let lead of orphanLeads) {
        if (distributionPool.length === 0) break;

        const user = distributionPool.pop(); // Taking from shuffled array
        const freshTimestamp = randomTodayTimestamp();

        batchUpdates.push({ leadId: lead.id, userId: user.id, timestamp: freshTimestamp });
        assignedCounts[user.id] = (assignedCounts[user.id] || 0) + 1;
    }

    // 4. Update the DB
    console.log(`\n⏳ Updating ${batchUpdates.length} leads in DB...`);
    let success = 0;

    for (let i = 0; i < batchUpdates.length; i++) {
        const b = batchUpdates[i];
        const { error } = await supabase.from('leads').update({
            assigned_to: b.userId,
            user_id: b.userId,
            status: 'Assigned',
            assigned_at: b.timestamp,
            created_at: b.timestamp // So they look fresh
        }).eq('id', b.leadId);

        if (!error) success++;
        else console.log(`  ❌ Error updating lead: ${error.message}`);

        if ((i + 1) % 50 === 0) console.log(`  Processed ${success}...`);
    }

    // Update leads_today
    console.log("Updating leads_today...");
    for (let u of pendingUsers) {
        if (assignedCounts[u.id] > 0) {
            await supabase.from('users').update({ leads_today: u.leads_today + assignedCounts[u.id] }).eq('id', u.id);
        }
    }

    // Summary
    console.log(`\n✅ Distributed ${success} leads!`);
    console.log("Distribution per user:");
    pendingUsers.sort((a, b) => (assignedCounts[b.id] || 0) - (assignedCounts[a.id] || 0)).forEach(u => {
        const got = assignedCounts[u.id] || 0;
        console.log(`  - ${u.name} (${u.plan}, Pending ${u.pending}): +${got} leads`);
    });
}

main().catch(console.error);
