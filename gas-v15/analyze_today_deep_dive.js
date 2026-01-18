import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function analyzeDeepDive() {
    console.log('\n🔍 --- DEEP DIVE: TODAY\'S DISTRIBUTION ANALYSIS ---\n');

    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);
    const startTodayIso = startToday.toISOString();

    // 1. Fetch ALL Leads Assigned or Created Today
    // We want leads assigned today, regardless of creation time (to check "Old" leads)
    const { data: assignments, error } = await supabase
        .from('leads')
        .select('id, name, created_at, assigned_at, assigned_to, source')
        .gt('assigned_at', startTodayIso);

    if (error) { console.log(error.message); return; }

    console.log(`📊 Total Assignments Today: ${assignments.length}`);

    // Fetch User Details (Name + Daily Limit)
    // Get ALL users to be safe
    const { data: users } = await supabase.from('users').select('id, name, daily_limit, leads_today');
    const userMap = {};
    users.forEach(u => userMap[u.id] = u);

    // 2. Analyze Stats
    const userStats = {};
    let freshCount = 0;
    let orphanReclaimCount = 0;
    let manualImportCount = 0; // Batch leads
    const oldLeadsAssigned = [];

    assignments.forEach(l => {
        const uid = l.assigned_to;
        if (!uid) return;
        const uName = userMap[uid]?.name || 'Unknown';

        // Initialize stat
        if (!userStats[uid]) {
            userStats[uid] = {
                name: uName,
                total: 0,
                sources: { fresh: 0, manual: 0, reclaimed: 0 },
                limit: userMap[uid]?.daily_limit || 0,
                isFull: false
            };
        }

        userStats[uid].total++;

        // Categorize Source
        const createdTime = new Date(l.created_at);
        const isCreatedToday = createdTime >= startToday;

        if (l.source.includes('Manual')) {
            userStats[uid].sources.manual++;
            manualImportCount++;
        } else if (l.source.includes('Meta') || l.source.includes('Facebook')) {
            // Check if it was "Fresh" or "Reclaimed/Orphan"
            // If assigned time is close to created time (< 30 mins diff), it's fresh
            const assignedTime = new Date(l.assigned_at);
            const diffMins = (assignedTime - createdTime) / 60000;

            if (diffMins < 60) {
                userStats[uid].sources.fresh++;
                freshCount++;
            } else {
                userStats[uid].sources.reclaimed++; // Orphan or Reclaimed
                orphanReclaimCount++;
            }
        } else {
            userStats[uid].sources.reclaimed++;
        }

        // Check for OLD Leads (Created before Today)
        if (!isCreatedToday && !l.source.includes('Manual')) {
            oldLeadsAssigned.push({ name: l.name, to: uName, created: l.created_at });
        }
    });

    // 3. Check Limits
    console.log(`\n📋 USER PERFORMANCE (Limit vs Received):`);
    const fullUsers = [];

    // Sort interesting ones to top
    const sortedIds = Object.keys(userStats).sort((a, b) => userStats[b].total - userStats[a].total);

    for (const uid of sortedIds) {
        const s = userStats[uid];
        const isLimitReached = s.total >= s.limit && s.limit > 0;

        if (isLimitReached) fullUsers.push(s);

        // Only print interesting ones (Total > 0)
        console.log(`👤 ${s.name.padEnd(20)} | Limit: ${s.limit} | Got: ${s.total} | (Fresh: ${s.sources.fresh}, Reclaimed/Orphan: ${s.sources.reclaimed}, Manual: ${s.sources.manual})`);
    }

    // 4. Summary
    console.log(`\n📈 SUMMARY:`);
    console.log(`- Fresh Real-time Leads: ${freshCount}`);
    console.log(`- Reclaimed/Orphan Leads: ${orphanReclaimCount}`);
    console.log(`- Manual Import Leads: ${manualImportCount}`);

    if (oldLeadsAssigned.length > 0) {
        console.log(`\n⚠️ WARNING: ${oldLeadsAssigned.length} OLD leads assigned today (Non-Manual)!`);
        oldLeadsAssigned.forEach(l => console.log(`   - ${l.name} -> ${l.to} (Created: ${l.created})`));
    } else {
        console.log(`\n✅ CLEANCHIT: No 'Old' leads assigned (except Manual Imports).`);
    }

    console.log(`\n🈵 Users who reached Daily Limit: ${fullUsers.length}`);
    if (fullUsers.length > 0) {
        console.log("   (Names: " + fullUsers.map(u => u.name).join(', ') + ")");
    }
}

analyzeDeepDive();
