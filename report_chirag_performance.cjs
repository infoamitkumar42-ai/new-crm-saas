const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function reportChiragPerformance() {
    console.log("🔍 Analyzing Chirag's Team Performance for TODAY...");

    // 1. Get Chirag's Team IDs
    const managerIds = [
        '8c653bc9-eb28-45d7-b658-4b3694956171',
        '460e0444-25a8-4ac9-9260-ce21be97aab3',
        'aac2b76b-0794-49e2-a030-91711ab5ecff',
        'c4c71cbb-6000-4137-b72f-2c07be2179e7',
        'a98f9160-17e8-4eac-904c-0518705fa67c'
    ];

    // Get all users in Chirag's team to map IDs
    const { data: teamUsers, error: teamError } = await supabase
        .from('users')
        .select('id, name')
        .in('manager_id', managerIds);

    if (teamError) {
        console.error("❌ Team Fetch Error:", teamError.message);
        return;
    }

    const teamUserIds = new Set(teamUsers.map(u => u.id));
    const teamUserMap = {};
    teamUsers.forEach(u => teamUserMap[u.id] = u.name);

    // 2. Fetch Today's Leads
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { data: leads, error: leadError } = await supabase
        .from('leads')
        .select('id, source, assigned_to, created_at')
        .gte('created_at', todayISO);

    if (leadError) {
        console.error("❌ Lead Fetch Error:", leadError.message);
        return;
    }

    // 3. Analyze
    let chiragSourceCount = 0;
    let teamLeadsReceived = 0;
    const recipients = new Set();
    const recipientCounts = {};

    leads.forEach(l => {
        // Count Source: 'Meta - Digital Chirag' (case insensitive check)
        if (l.source && l.source.toLowerCase().includes('chirag')) {
            chiragSourceCount++;
        }

        // Count Team Distribution
        if (l.assigned_to && teamUserIds.has(l.assigned_to)) {
            teamLeadsReceived++;
            recipients.add(l.assigned_to);
            recipientCounts[l.assigned_to] = (recipientCounts[l.assigned_to] || 0) + 1;
        }
    });

    console.log(`\n📊 CHIRAG'S PAGE PERFORMANCE (Today):`);
    console.log(`- Total Leads Generated: ${chiragSourceCount}`);

    console.log(`\n👥 TEAM DISTRIBUTION:`);
    console.log(`- Total Leads Assigned to Team: ${teamLeadsReceived}`);
    console.log(`- Unique Members Receiving Leads: ${recipients.size}`);

    console.log(`\n🏆 TOP RECEIVERS (Today):`);
    const sortedRecipients = Object.entries(recipientCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([id, count]) => ({ name: teamUserMap[id], count }));

    sortedRecipients.forEach(r => {
        console.log(`- ${r.name.padEnd(25)}: ${r.count}`);
    });

}

reportChiragPerformance();
