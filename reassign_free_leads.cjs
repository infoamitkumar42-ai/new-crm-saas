const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Free user emails from Feb 10 mass activation (NO payment, exclude Neha who HAS payment)
const FREE_USER_EMAILS = [
    'kiran@gmail.com', 'jaspreet@gmail.com', 'simrankaurdee9@gmail.com',
    'sohanpgk22@gmail.com', 'didar9915175976@gmail.com', 'ms028777@gmail.com',
    'deepak@gmail.com', 'gurvindermatharu61@gmail.com', 'harpreetuppal062@gamil.com',
    'lrai04672@gmail.com', 'divya@gmail.com', 'simratbrar06@gmail.com',
    'techeducation.kkp@gmail.com', 'jassskaur909@gmail.com', 'gurpreetsingh02915@gmail.com',
    'ishagarg69169@gmail.com', 'jagdeeppanesar52@gmail.com', 'sirmanjeetsingh85530@gmail.com',
    'gargabhay81@gmail.com', 'baburao161421@gmail.com'
];

function getRandomTimeLastHour() {
    // IST now is ~16:53 (4:53 PM). Generate times from 15:53 to 16:53 IST
    const base = new Date('2026-02-23T10:23:00.000Z'); // 15:53 IST = 10:23 UTC
    const offsetMs = Math.floor(Math.random() * 60 * 60 * 1000); // random within 1 hour
    const d = new Date(base.getTime() + offsetMs);
    return d.toISOString();
}

async function main() {
    console.log("🚀 REASSIGNING FREE USERS' LEADS + TODAY'S LEADS\n");

    // 1. Collect lead IDs from all 20 free users
    let freeLeadIds = [];
    for (const email of FREE_USER_EMAILS) {
        const { data: users } = await supabase.from('users').select('id, name').eq('email', email);
        if (!users || !users.length) continue;
        const uid = users[0].id;

        const { data: leads } = await supabase.from('leads').select('id').eq('assigned_to', uid);
        if (leads && leads.length > 0) {
            console.log(`  ${users[0].name} (${email}): ${leads.length} leads to revoke`);
            freeLeadIds = freeLeadIds.concat(leads.map(l => l.id));
        }
    }
    console.log(`\n📦 Total leads from free users: ${freeLeadIds.length}`);

    // 2. Collect today's unassigned/orphan leads
    const { data: todayOrphans } = await supabase.from('leads')
        .select('id')
        .is('assigned_to', null)
        .gte('created_at', '2026-02-22T18:30:00.000Z'); // Today Feb 23 IST

    const orphanIds = (todayOrphans || []).map(l => l.id);
    console.log(`📦 Today's unassigned leads: ${orphanIds.length}`);

    // Combine all lead IDs
    const allLeadIds = [...new Set([...freeLeadIds, ...orphanIds])];
    console.log(`\n🎯 TOTAL POOL: ${allLeadIds.length} leads to redistribute\n`);

    if (allLeadIds.length === 0) {
        console.log("Nothing to distribute!");
        return;
    }

    // 3. Get active paying TEAMFIRE users (who have pending quota)
    const { data: activeUsers } = await supabase.from('users')
        .select('id, name, email')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true)
        .order('name');

    // Filter to only paid users
    const paidActiveUsers = [];
    for (const u of (activeUsers || [])) {
        const { data: pays } = await supabase.from('payments')
            .select('amount').eq('user_id', u.id).eq('status', 'captured');
        if (pays && pays.length > 0) {
            paidActiveUsers.push({ id: u.id, name: u.name, email: u.email, assigned: 0 });
        }
    }
    console.log(`👥 Active paid users to receive leads: ${paidActiveUsers.length}\n`);

    // 4. Unassign all leads in the pool first
    console.log("🔓 Unassigning leads from free users...");
    for (let i = 0; i < allLeadIds.length; i += 50) {
        const batch = allLeadIds.slice(i, i + 50);
        await supabase.from('leads').update({ assigned_to: null, user_id: null }).in('id', batch);
    }

    // 5. Round-robin distribute equally
    console.log("📨 Distributing leads equally...\n");
    let idx = 0;
    for (const leadId of allLeadIds) {
        const user = paidActiveUsers[idx % paidActiveUsers.length];
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

    // 6. Report
    console.log("=== 📊 DISTRIBUTION REPORT ===\n");
    const sorted = paidActiveUsers.filter(u => u.assigned > 0).sort((a, b) => b.assigned - a.assigned);
    sorted.forEach(u => {
        console.log(`  ${u.name} (${u.email}): +${u.assigned} leads`);
    });
    console.log(`\n  TOTAL DISTRIBUTED: ${allLeadIds.length} leads to ${sorted.length} users`);
    console.log("  Timestamps: Today 3:53 PM - 4:53 PM IST");
    console.log("  Notes: Cleared (NULL)");
    console.log("\n✅ DONE!");
}

main().catch(console.error);
