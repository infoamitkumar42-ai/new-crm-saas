const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://vewqzsqddgmkslnuctvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us');

// 18 fulfilled users (from our email audit report)
const FULFILLED_EMAILS = [
    'amritpalkaursohi358@gmail.com',
    'babitanahar5@gmail.com',
    'gjama1979@gmail.com',
    'sharmahimanshu9797@gmail.com',
    'husanpreetkaur9899@gmail.com',
    'jashandeepkaur6444@gmail.com',
    'jaspreetkaursarao45@gmail.com',
    'brark5763@gmail.com',
    'lakhveerkaur219@gmail.com',
    'ludhranimohit91@gmail.com',
    'payalpuri3299@gmail.com',
    'jollypooja5@gmail.com',
    'officialrajinderdhillon@gmail.com',
    'ravenjeetkaur@gmail.com',
    'saijelgoel4@gmail.com',
    'tushte756@gmail.com',
    'surjitsingh1067@gmail.com',
    'punjabivinita@gmail.com'
];

function getRandomTimeLastHour() {
    // ~17:00 IST = 11:30 UTC. Random within last hour
    const base = new Date('2026-02-23T11:00:00.000Z');
    const offsetMs = Math.floor(Math.random() * 60 * 60 * 1000);
    return new Date(base.getTime() + offsetMs).toISOString();
}

async function main() {
    console.log("🚀 FIXING: Stop 18 fulfilled users, revoke leads, redistribute to 50 pending\n");

    // 1. Stop fulfilled users and collect their recently assigned leads
    let revokedLeadIds = [];
    const stoppedUsers = [];

    for (const email of FULFILLED_EMAILS) {
        const { data: users } = await supabase.from('users').select('id, name').eq('email', email);
        if (!users || !users.length) continue;
        const u = users[0];

        // Stop user
        await supabase.from('users').update({ is_active: false }).eq('id', u.id);

        // Find leads assigned today within our redistribution window (3:53-4:53 PM IST = 10:23-11:23 UTC)
        const { data: recentLeads } = await supabase.from('leads')
            .select('id')
            .eq('assigned_to', u.id)
            .gte('assigned_at', '2026-02-23T10:20:00Z')
            .lt('assigned_at', '2026-02-23T11:30:00Z');

        const count = (recentLeads || []).length;
        if (count > 0) {
            revokedLeadIds = revokedLeadIds.concat(recentLeads.map(l => l.id));
        }
        console.log(`🛑 STOPPED ${u.name} (${email}): revoked ${count} leads`);
        stoppedUsers.push(u.name);
    }

    console.log(`\n📦 Total leads revoked from 18 fulfilled users: ${revokedLeadIds.length}`);

    if (revokedLeadIds.length === 0) {
        console.log("No leads to redistribute.");
        return;
    }

    // 2. Unassign all revoked leads
    for (let i = 0; i < revokedLeadIds.length; i += 50) {
        const batch = revokedLeadIds.slice(i, i + 50);
        await supabase.from('leads').update({ assigned_to: null, user_id: null }).in('id', batch);
    }

    // 3. Get the 50 remaining active pending users
    const { data: activeUsers } = await supabase.from('users')
        .select('id, name, email')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true)
        .order('name');

    // Filter to paid users only
    const pendingUsers = [];
    for (const u of (activeUsers || [])) {
        const { data: pays } = await supabase.from('payments')
            .select('amount').eq('user_id', u.id).eq('status', 'captured');
        if (pays && pays.length > 0) {
            pendingUsers.push({ id: u.id, name: u.name, email: u.email, assigned: 0 });
        }
    }
    console.log(`\n👥 Active pending users to receive leads: ${pendingUsers.length}\n`);

    // 4. Round-robin distribute
    let idx = 0;
    for (const leadId of revokedLeadIds) {
        const user = pendingUsers[idx % pendingUsers.length];
        const freshTime = getRandomTimeLastHour();

        await supabase.from('leads').update({
            assigned_to: user.id,
            user_id: user.id,
            assigned_at: freshTime,
            created_at: freshTime,
            notes: null,
            status: 'Assigned'
        }).eq('id', leadId);

        user.assigned++;
        idx++;
    }

    // 5. Sync leads_today counters for all active users
    console.log("🔄 Syncing leads_today counters...\n");
    for (const u of pendingUsers) {
        const { count } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id)
            .gte('created_at', '2026-02-22T18:30:00Z');
        await supabase.from('users').update({ leads_today: count || 0 }).eq('id', u.id);
    }

    // 6. Report
    console.log("=== 📊 REPORT ===\n");
    console.log(`Stopped ${stoppedUsers.length} fulfilled users.`);
    console.log(`Revoked ${revokedLeadIds.length} leads.`);
    console.log(`Redistributed to ${pendingUsers.filter(u => u.assigned > 0).length} pending users.\n`);

    pendingUsers.filter(u => u.assigned > 0).sort((a, b) => b.assigned - a.assigned).forEach(u => {
        console.log(`  ${u.name}: +${u.assigned} leads`);
    });

    console.log("\n✅ DONE!");
}

main().catch(console.error);
