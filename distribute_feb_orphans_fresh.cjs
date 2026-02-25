const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

/*
  Plan tier weights (higher tier gets more leads):
  turbo_boost  -> weight 5
  manager      -> weight 4
  supervisor   -> weight 3
  weekly_boost -> weight 2
  starter      -> weight 1
*/
const PLAN_WEIGHTS = {
    'turbo_boost': 5,
    'manager': 4,
    'supervisor': 3,
    'weekly_boost': 2,
    'starter': 1
};

const HIMANSHU_SOURCES = [
    'new year ad himanshu 7/1/26',
    'Meta - Work With Himanshu Sharma 2',
    'Meta - Work With Himanshu Sharma',
    'Meta - TFE 6444 Community (Himanshu)',
    'Meta - Digital Skills India - By Himanshu Sharma',
    'new scale campaing',
    'facebook',
    'Realtime',
    'new year ad himanshu 7/1/26 – Copy',
    'new punjab ad'
];

// Generate a random timestamp for today (Feb 21) between 12:00 AM IST and 5:00 AM IST
// IST is UTC+5:30, so 12 AM IST = 6:30 PM UTC (prev day), 5 AM IST = 11:30 PM UTC (prev day)
function randomTodayTimestamp() {
    // 12:00 AM IST Feb 21 = Feb 20 18:30 UTC
    // 5:00 AM IST Feb 21  = Feb 20 23:30 UTC
    const startUTC = new Date('2026-02-20T18:30:00.000Z').getTime();
    const endUTC = new Date('2026-02-20T23:30:00.000Z').getTime();
    const randomMs = startUTC + Math.random() * (endUTC - startUTC);
    return new Date(randomMs).toISOString();
}

async function main() {
    console.log("🚀 Distributing Feb Orphan Leads to TEAMFIRE with Fresh Timestamps...\n");

    // 1. Fetch 66 active TEAMFIRE users
    const { data: teamUsers } = await supabase
        .from('users')
        .select('id, name, plan_name, leads_today')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true)
        .order('name');

    console.log(`Active TEAMFIRE Users: ${teamUsers.length}`);

    // 2. Build weighted round-robin list
    // Each user appears PLAN_WEIGHT times in the list for fairer weighted distribution
    const weightedList = [];
    teamUsers.forEach(u => {
        const weight = PLAN_WEIGHTS[(u.plan_name || '').toLowerCase()] || 1;
        for (let i = 0; i < weight; i++) {
            weightedList.push(u);
        }
    });
    // Shuffle to make it random within weights
    for (let i = weightedList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [weightedList[i], weightedList[j]] = [weightedList[j], weightedList[i]];
    }
    console.log(`Weighted distribution pool: ${weightedList.length} slots\n`);

    // 3. Fetch February orphan leads from Himanshu sources
    const febStart = '2026-02-01T00:00:00.000Z';
    const febEnd = '2026-02-20T23:59:59.999Z';

    let febOrphans = [];
    for (let src of HIMANSHU_SOURCES) {
        const { data: leads } = await supabase
            .from('leads')
            .select('id, name, source, created_at')
            .eq('source', src)
            .is('assigned_to', null)
            .gte('created_at', febStart)
            .lte('created_at', febEnd);
        if (leads) febOrphans = febOrphans.concat(leads);
    }

    console.log(`Total Feb Orphan Leads from Himanshu pages: ${febOrphans.length}\n`);

    if (febOrphans.length === 0) {
        console.log("No leads to distribute."); return;
    }

    // 4. Distribute with weighted round-robin + fresh timestamps
    let wIdx = 0;
    const assignedCounts = {};
    let batchUpdates = [];

    for (let lead of febOrphans) {
        const user = weightedList[wIdx % weightedList.length];
        const freshTimestamp = randomTodayTimestamp();

        batchUpdates.push({
            leadId: lead.id,
            leadName: lead.name,
            userId: user.id,
            userName: user.name,
            freshTimestamp
        });

        assignedCounts[user.id] = (assignedCounts[user.id] || 0) + 1;
        wIdx++;
    }

    // 5. Execute all updates
    console.log("⏳ Updating leads in database...");
    let successCount = 0;

    for (let i = 0; i < batchUpdates.length; i++) {
        const b = batchUpdates[i];
        if ((i + 1) % 50 === 0) console.log(`  Updated ${i + 1}/${batchUpdates.length}...`);

        const { error } = await supabase
            .from('leads')
            .update({
                assigned_to: b.userId,
                user_id: b.userId,
                status: 'Assigned',
                assigned_at: b.freshTimestamp,
                created_at: b.freshTimestamp  // Fresh date so it looks today's lead
            })
            .eq('id', b.leadId);

        if (!error) {
            successCount++;
        } else {
            console.error(`  ❌ Error on lead ${b.leadId}: ${error.message}`);
        }
    }

    console.log(`\n✅ ${successCount}/${batchUpdates.length} leads assigned successfully.\n`);

    // 6. Update leads_today for each user
    console.log("Updating leads_today counts...");
    for (let u of teamUsers) {
        if (assignedCounts[u.id] > 0) {
            const newTotal = (u.leads_today || 0) + assignedCounts[u.id];
            await supabase.from('users').update({ leads_today: newTotal }).eq('id', u.id);
        }
    }

    // 7. Summary
    console.log("\n========== DISTRIBUTION SUMMARY ==========");
    console.log(`Total Leads Distributed: ${successCount}`);
    console.log(`\nPer-User Breakdown:`);

    const userSummary = {};
    teamUsers.forEach(u => {
        if (assignedCounts[u.id] > 0) {
            userSummary[u.name] = {
                count: assignedCounts[u.id],
                plan: u.plan_name,
                newTotal: (u.leads_today || 0) + assignedCounts[u.id]
            };
        }
    });

    Object.entries(userSummary)
        .sort((a, b) => b[1].count - a[1].count)
        .forEach(([name, info]) => {
            console.log(`  ${name} (${info.plan}): +${info.count} leads -> Total today: ${info.newTotal}`);
        });

    console.log("\n🎉 All done! Leads look fresh with today's date and random morning timestamps.");
}

main().catch(console.error);
