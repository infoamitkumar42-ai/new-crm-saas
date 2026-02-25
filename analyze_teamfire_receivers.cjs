const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function analyzeReceivers() {
    console.log("🕵️ ANALYZING RECENT 150 LEADS (TEAMFIRE Focus)...");

    // 1. Fetch recent leads with 'TEAMFIRE' inferred source
    const { data: leads } = await supabase
        .from('leads')
        .select('id, assigned_to, source, created_at')
        .order('created_at', { ascending: false })
        .limit(150);

    const teamfireReceivers = {}; // userId -> count

    for (const l of leads) {
        if (l.source && (l.source.includes('Himanshu') || l.source.includes('TFE'))) {
            // This is a TEAMFIRE lead
            if (l.assigned_to) {
                teamfireReceivers[l.assigned_to] = (teamfireReceivers[l.assigned_to] || 0) + 1;
            }
        }
    }

    // 2. Profile the winners
    console.log("\n🏆 TEAMFIRE RECEIVERS (Last ~4 hours):");
    const receiverIds = Object.keys(teamfireReceivers);

    if (receiverIds.length === 0) {
        console.log("   (No TEAMFIRE leads assigned in this batch. Maybe all Queued?)");
        return;
    }

    const { data: users } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit, daily_limit_override, plan_name')
        .in('id', receiverIds);

    const userMap = {};
    users.forEach(u => userMap[u.id] = u);

    // Sort by most received
    receiverIds.sort((a, b) => teamfireReceivers[b] - teamfireReceivers[a]);

    for (const uid of receiverIds) {
        const u = userMap[uid];
        const count = teamfireReceivers[uid];
        console.log(`\n   👤 ${u.name} (${u.plan_name})`);
        console.log(`      Received in batch: ${count}`);
        console.log(`      Current Total Today: ${u.leads_today}`);
        console.log(`      Limit: ${u.daily_limit_override || u.daily_limit}`);
    }
}

analyzeReceivers();
