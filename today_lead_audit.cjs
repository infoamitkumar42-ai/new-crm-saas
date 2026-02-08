
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function getTodayLeadAudit() {
    const today = new Date().toISOString().split('T')[0];
    console.log(`📊 Lead Distribution Audit - Date: ${today}\n`);

    // 1. Fetch leads from today
    const { data: leads, error } = await supabase
        .from('leads')
        .select(`
            id, 
            name, 
            status, 
            source, 
            assigned_to, 
            created_at
        `)
        .gte('created_at', today + 'T00:00:00Z')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("❌ Error fetching leads:", error);
        return;
    }

    if (!leads || leads.length === 0) {
        console.log("📭 No leads received today yet.");
        return;
    }

    console.log(`Total Leads Today: ${leads.length}\n`);

    // 2. Fetch all users involved for team info
    const userIds = [...new Set(leads.filter(l => l.assigned_to).map(l => l.assigned_to))];
    const { data: users } = await supabase
        .from('users')
        .select('id, name, team_code')
        .in('id', userIds);

    const userMap = users?.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
    }, {}) || {};

    // 3. Table Breakdown
    const breakdown = leads.map(l => {
        const assignedUser = userMap[l.assigned_to];
        let sourceTeam = "Unknown";

        // Map source string to potential team
        if (l.source.includes("Himanshu")) sourceTeam = "TEAMFIRE";
        else if (l.source.includes("Chirag") || l.source.includes("Bhumit")) sourceTeam = "GJ01TEAMFIRE";
        else if (l.source.includes("Rajwinder")) sourceTeam = "TEAMRAJ";
        else if (l.source.includes("Web")) sourceTeam = "ORGANIC/WEB";

        return {
            "Lead Name": l.name,
            "Source Page/Team": l.source,
            "Estimated Source Team": sourceTeam,
            "Target User": assignedUser ? assignedUser.name : "N/A",
            "Target User Team": assignedUser ? assignedUser.team_code : "N/A",
            "Status": l.status,
            "Time": new Date(l.created_at).toLocaleTimeString('en-IN')
        };
    });

    console.table(breakdown);

    // 4. Team-wise Aggregation
    const stats = {};
    breakdown.forEach(b => {
        const key = b["Estimated Source Team"] + " ➔ " + b["Target User Team"];
        stats[key] = (stats[key] || 0) + 1;
    });

    console.log("\n📈 Assignment Summary (Source Team ➔ Destination Team):");
    Object.entries(stats).forEach(([flow, count]) => {
        console.log(` - ${flow}: ${count} leads`);
    });
}

getTodayLeadAudit();
