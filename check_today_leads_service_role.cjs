const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTodayLeads() {
    console.log("🔍 Checking leads distribution status for TODAY (UTC)...");

    // Today Start
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // 1. Fetch Today's Leads (NO page_name)
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, created_at, source, assigned_to, user_id, status')
        .gte('created_at', todayISO)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("❌ Error fetching leads:", error);
        return;
    }

    console.log(`📊 Total Leads Today: ${leads.length}`);

    if (leads.length === 0) {
        console.log("⚠️ No leads found for today.");
        return;
    }

    // 2. Check Distribution
    let distributedCount = 0;
    let stuckCount = 0;
    let assignedIds = new Set();

    leads.forEach(l => {
        if (l.assigned_to) {
            distributedCount++;
            assignedIds.add(l.assigned_to);
        } else {
            stuckCount++;
        }
    });

    // 3. Fetch Assignee Names
    let userNames = {};
    if (assignedIds.size > 0) {
        const { data: users } = await supabase
            .from('users')
            .select('id, name')
            .in('id', Array.from(assignedIds));

        if (users) {
            users.forEach(u => userNames[u.id] = u.name);
        }
    }

    // 4. Report
    console.log("\n🚀 DISTRIBUTION STATUS:");
    console.log(`✅ Distributed (Assigned): ${distributedCount}`);
    console.log(`❌ Stuck/Orphan (Unassigned): ${stuckCount}`);

    if (stuckCount > 0) {
        console.log("⚠️ WARNING: Leads are stuck in Orphan state!");
    } else {
        console.log("✅ All leads distributed successfully!");
    }

    console.log("\n🕒 Latest 5 Assignments:");
    leads.slice(0, 5).forEach(l => {
        const assignee = l.assigned_to ? (userNames[l.assigned_to] || 'Unknown User') : '🛑 ORPHAN (Stuck)';
        console.log(`- ${l.name} (${new Date(l.created_at).toLocaleTimeString()}) -> 👤 ${assignee} [${l.source}]`);
    });

    // 5. Source Breakdown
    const sources = {};
    leads.forEach(l => {
        const s = l.source || 'Unknown Source';
        sources[s] = (sources[s] || 0) + 1;
    });
    console.log("\n📈 Source Breakdown:", sources);
}

checkTodayLeads();
