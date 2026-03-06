const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTeams() {
    const { data: teams } = await supabase.from('users').select('team_code').not('team_code', 'is', null);
    const set = new Set(teams.map(t => t.team_code));
    console.log('Available Team Codes:', Array.from(set));
}

async function auditTeam() {
    console.log('--- Auditing Active Members ---');

    const { data: users, error } = await supabase
        .from('users')
        .select(`
            id, 
            name, 
            email, 
            is_active, 
            daily_limit, 
            daily_limit_override, 
            total_leads_promised,
            plan_activation_time,
            team_code
        `)
        .eq('is_active', true);

    if (error) {
        console.error('User fetch error:', error);
        return;
    }

    // Filter for TEAMFIRE or members with TEAMFIRE in name/team_code
    const teamfireMembers = users.filter(u =>
        (u.team_code && u.team_code.toUpperCase().includes('TEAMFIRE')) ||
        (u.name && u.name.toUpperCase().includes('TEAMFIRE'))
    );

    console.log(`Found ${teamfireMembers.length} active TeamFire members.`);

    const userStats = [];

    for (const user of teamfireMembers) {
        const activationDate = user.plan_activation_time ? new Date(user.plan_activation_time) : new Date('2026-02-01');

        const { count: receivedCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id)
            .gte('assigned_at', activationDate.toISOString());

        const limit = user.daily_limit_override || user.daily_limit || 0;
        const promised = user.total_leads_promised || 0;
        const received = receivedCount || 0;
        const pending = Math.max(0, promised - received);

        userStats.push({
            id: user.id,
            name: user.name,
            email: user.email,
            limit,
            promised,
            received,
            pending,
            team_code: user.team_code
        });
    }

    userStats.sort((a, b) => b.pending - a.pending);
    console.log(JSON.stringify(userStats, null, 2));
}

auditTeam();
checkTeams();
