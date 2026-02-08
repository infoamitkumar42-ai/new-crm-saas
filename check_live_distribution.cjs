
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkLiveDistribution() {
    console.log("🕵️‍♂️ Checking Live Lead Distribution (Today)...");

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Fetch leads created today
    const { data: leads, error } = await supabase
        .from('leads')
        .select(`
            id, name, created_at, source, status, assigned_to
        `)
        .gte('created_at', startOfDay.toISOString())
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching leads:", error);
        return;
    }

    if (!leads || leads.length === 0) {
        console.log("⚠️ No leads found today yet.");
        return;
    }

    console.log(`✅ Total Leads Today: ${leads.length}\n`);

    // Fetch user details for these leads to check Team Assignment
    const assignedIds = leads.map(l => l.assigned_to).filter(id => id); // Remove nulls

    let userMap = {};
    if (assignedIds.length > 0) {
        const { data: users } = await supabase
            .from('users')
            .select('id, name, team_code, daily_limit, leads_today')
            .in('id', assignedIds);

        if (users) {
            users.forEach(u => userMap[u.id] = u);
        }
    }

    // Analyze Distribution
    let distribution = {
        'TEAMFIRE (Himanshu)': 0,
        'TEAMRAJ (Rajwinder)': 0,
        'GJ01TEAMFIRE (Chirag)': 0,
        'TEAMSIMRAN': 0,
        'Other/Unassigned': 0
    };

    const tableData = leads.map(l => {
        const user = userMap[l.assigned_to];
        const team = user ? user.team_code : 'Unassigned';

        // Count for Summary
        if (team === 'TEAMFIRE') distribution['TEAMFIRE (Himanshu)']++;
        else if (team === 'TEAMRAJ') distribution['TEAMRAJ (Rajwinder)']++;
        else if (team === 'GJ01TEAMFIRE') distribution['GJ01TEAMFIRE (Chirag)']++;
        else if (team === 'TEAMSIMRAN') distribution['TEAMSIMRAN']++;
        else distribution['Other/Unassigned']++;

        return {
            Time: new Date(l.created_at).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' }),
            Source: l.source.substring(0, 30), // Truncate for display
            AssignedTo: user ? user.name : 'NULL',
            Team: team,
            Status: l.status
        };
    });

    console.table(tableData.slice(0, 20)); // Show top 20
    console.log("\n📊 TEAM DISTRIBUTION SUMMARY:");
    console.table(distribution);
}

checkLiveDistribution();
