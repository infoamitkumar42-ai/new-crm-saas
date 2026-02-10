const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function auditRajwinderTeam() {
    console.log("🔍 Auditing Rajwinder's Team Performance...");

    // 1. Find Rajwinder Manager IDs
    const { data: managers, error: mgrError } = await supabase
        .from('users')
        .select('id, name')
        .ilike('name', '%Rajwinder%');

    if (mgrError || !managers.length) {
        console.error("❌ Could not find manager 'Rajwinder'");
        return;
    }

    const managerIds = managers.map(m => m.id);
    console.log(`✅ Found manager IDs for ${managers.map(m => m.name).join(', ')}`);

    // 2. Fetch Team Users
    const { data: teamUsers, error: userError } = await supabase
        .from('users')
        .select('id, name, email, is_online, is_active, payment_status, leads_today')
        .in('manager_id', managerIds);

    if (userError) {
        console.error("❌ Error fetching users:", userError.message);
        return;
    }

    // 3. Fetch Today's Leads from Source
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const { data: leads, error: leadError } = await supabase
        .from('leads')
        .select('id, source, assigned_to')
        .gte('created_at', startOfDay.toISOString());

    if (leadError) {
        console.error("❌ Error fetching leads:", leadError.message);
        return;
    }

    // 4. Analyze Performance
    const teamUserIds = new Set(teamUsers.map(u => u.id));
    const teamUserMap = {};
    teamUsers.forEach(u => teamUserMap[u.id] = u.name);

    let rajSourceCount = 0;
    let teamLeadsReceived = 0;
    const recipientCounts = {};

    leads.forEach(l => {
        // Source check (Rajwinder Pages)
        if (l.source && l.source.toLowerCase().includes('rajwinder')) {
            rajSourceCount++;
        }

        // Assignment check
        if (l.assigned_to && teamUserIds.has(l.assigned_to)) {
            teamLeadsReceived++;
            recipientCounts[l.assigned_to] = (recipientCounts[l.assigned_to] || 0) + 1;
        }
    });

    // 5. Categorize Team members
    const activeOnline = teamUsers.filter(u => u.is_online && (u.is_active || u.payment_status === 'active'));
    const offlineOrInactive = teamUsers.filter(u => !u.is_online || (!u.is_active && u.payment_status !== 'active'));

    console.log(`\n📊 RAJWINDER'S PAGE STATS (Today):`);
    console.log(`- Total Leads Created from Rajwinder's Source: ${rajSourceCount}`);

    console.log(`\n👥 TEAM SUMMARY:`);
    console.log(`- Total Team Members: ${teamUsers.length}`);
    console.log(`- Active & Online (Ready to receive): ${activeOnline.length}`);
    console.log(`- Total Leads Assigned to Team Today: ${teamLeadsReceived}`);

    console.log(`\n🏆 TEAM MEMBERS WHO RECEIVED LEADS:`);
    const sortedReceivers = Object.entries(recipientCounts)
        .sort(([, a], [, b]) => b - a);

    if (sortedReceivers.length === 0) {
        console.log("- No one in the team has received leads yet today.");
    } else {
        sortedReceivers.forEach(([id, count]) => {
            console.log(`- ${teamUserMap[id].padEnd(25)}: ${count} Leads`);
        });
    }

    console.log(`\n⚠️ OFFLINE / PAUSED MEMBERS:`);
    const paidOffline = offlineOrInactive.filter(u => u.payment_status === 'active');
    if (paidOffline.length === 0) {
        console.log("- No paid users are offline. Everyone is ready!");
    } else {
        console.log(`Found ${paidOffline.length} Paid users who are OFFLINE:`);
        paidOffline.forEach(u => {
            console.log(`- ${u.name.padEnd(25)} (${u.email})`);
        });
    }
}

auditRajwinderTeam();
