const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const teams = ['TEAMFIRE', 'TEAMSIMRAN'];

// Boosters context from user's manual list
const boostersData = [
    { email: 'ravenjeetkaur@gmail.com', quota: 92, renewal: '2026-02-03' },
    { email: 'vansh.rajni.96@gmail.com', quota: 92, renewal: '2026-01-30' },
    { email: 'payalpuri3299@gmail.com', quota: 92, renewal: '2026-02-04' },
    { email: 'princyrani303@gmail.com', quota: 108, renewal: '2026-02-05' },
    { email: 'aansh8588@gmail.com', quota: 92, renewal: '2026-02-08' },
    { email: 'nitinanku628@gmail.com', quota: 92, renewal: '2026-02-10' },
    { email: 'saijelgoel4@gmail.com', quota: 92, renewal: '2026-02-03' },
    { email: 'navpreetkaur95271@gmail.com', quota: 92, renewal: '2026-02-04' },
    { email: 'officialrajinderdhillon@gmail.com', quota: 92, renewal: '2026-02-03' },
    { email: 'prince@gmail.com', quota: 92, renewal: '2026-02-09' },
    { email: 'jaspreetkaursarao45@gmail.com', quota: 92, renewal: '2026-02-04' },
    { email: 'rupanasameer551@gmail.com', quota: 92, renewal: '2026-02-08' },
    { email: 'ludhranimohit91@gmail.com', quota: 92, renewal: '2026-02-03' },
    { email: 'goldymahi27@gmail.com', quota: 92, renewal: '2026-02-05' },
    { email: 'amritpalkaursohi358@gmail.com', quota: 92, renewal: '2026-02-03' },
    { email: 'surjitsingh1067@gmail.com', quota: 92, renewal: '2026-02-04' },
    { email: 'mandeepbrar1325@gmail.com', quota: 92, renewal: '2026-02-02' },
    { email: 'jk419473@gmail.com', quota: 108, renewal: '2026-02-03' },
    { email: 'punjabivinita@gmail.com', quota: 92, renewal: '2026-02-06' },
    { email: 'ajayk783382@gmail.com', quota: 92, renewal: '2026-02-07' },
    { email: 'samandeepkaur1216@gmail.com', quota: 92, renewal: '2026-02-14' },
    { email: 'rohitgagneja69@gmail.com', quota: 92, renewal: '2026-02-04' },
    { email: 'ziana4383@gmail.com', quota: 92, renewal: '2026-02-04' },
    { email: 'loveleenkaur8285@gmail.com', quota: 92, renewal: '2026-02-12' }
];

(async () => {
    console.log('--- 🔍 AUDITING INACTIVE USERS WITH PENDING LEADS ---');

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, team_code, is_active, plan_name, total_leads_promised, total_leads_received')
        .in('team_code', teams)
        .eq('is_active', false);

    if (error) {
        console.error(error);
        return;
    }

    const pendingUsers = [];

    for (const u of users) {
        // 1. Check if user is a booster
        const booster = boostersData.find(b => b.email === u.email);

        let pendingCount = 0;
        let received = 0;
        let quota = 0;

        if (booster) {
            // Calculate based on specific renewal for boosters
            const { count } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_to', u.id)
                .gte('created_at', `${booster.renewal}T00:00:00Z`);

            received = count || 0;
            quota = booster.quota;
            pendingCount = Math.max(0, quota - received);
        } else {
            // For non-boosters, use basic counters
            quota = u.total_leads_promised || 0;
            received = u.total_leads_received || 0;
            pendingCount = Math.max(0, quota - received);
        }

        if (pendingCount > 0 && quota > 0) {
            pendingUsers.push({
                Name: u.name,
                Email: u.email,
                Team: u.team_code,
                Plan: u.plan_name,
                Quota: quota,
                Received: received,
                Pending: pendingCount
            });
        }
    }

    console.log(`\nFound ${pendingUsers.length} Inactive Users with Pending Leads:`);
    console.table(pendingUsers);

    // Summary by Team
    const teamSummary = {};
    pendingUsers.forEach(u => {
        teamSummary[u.Team] = (teamSummary[u.Team] || 0) + 1;
    });
    console.log('\nSummary by Team:');
    console.table(teamSummary);

})();
