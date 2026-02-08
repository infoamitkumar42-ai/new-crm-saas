
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function identifyTeams() {
    console.log("🕵️‍♂️ IDENTIFYING AFFECTED TEAMS (Whose leads were invisible?)...\n");

    const today = new Date().toISOString().split('T')[0];

    // 1. Get Leads fixed today (We assume assigned_at was just updated)
    // We can just check leads created today and group by user -> team

    const { data: leads } = await supabase.from('leads')
        .select('assigned_to')
        .gte('created_at', today + 'T00:00:00');

    if (!leads) return;

    // Get Unique User IDs
    const userIds = [...new Set(leads.map(l => l.assigned_to).filter(Boolean))];

    // Get User Details (Team Code)
    const { data: users } = await supabase.from('users')
        .select('id, name, team_code, leads_today')
        .in('id', userIds);

    const teamCounts = {};
    const teamLabels = {
        'GJ01TEAMFIRE': 'Chirag (GJ01TEAMFIRE)',
        'TEAMFIRE': 'Himanshu (TEAMFIRE)',
        'TEAMRAJ': 'Rajwinder (TEAMRAJ)',
        'TEAMSIMRAN': 'Simran (TEAMSIMRAN)'
    };

    users.forEach(u => {
        const t = u.team_code || 'NO_TEAM';
        const label = teamLabels[t] || t;

        teamCounts[label] = (teamCounts[label] || 0) + u.leads_today;
    });

    console.log("📊 AFFECTED TEAMS BREAKDOWN (Leads fixed):");
    console.table(teamCounts);
}

identifyTeams();
