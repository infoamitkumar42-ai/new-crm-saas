const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_EMAILS = [
    'ravenjeetkaur@gmail.com', 'vansh.rajni.96@gmail.com', 'payalpuri3299@gmail.com',
    'princyrani303@gmail.com', 'aansh8588@gmail.com', 'nitinanku628@gmail.com',
    'saijelgoel4@gmail.com', 'navpreetkaur95271@gmail.com', 'officialrajinderdhillon@gmail.com',
    'prince@gmail.com', 'jaspreetkaursarao45@gmail.com', 'rupanasameer551@gmail.com',
    'ludhranimohit91@gmail.com', 'goldymahi27@gmail.com', 'amritpalkaursohi358@gmail.com',
    'surjitsingh1067@gmail.com', 'mandeepbrar1325@gmail.com', 'jk419473@gmail.com',
    'punjabivinita@gmail.com', 'ajayk783382@gmail.com', 'samandeepkaur1216@gmail.com',
    'rohitgagneja69@gmail.com', 'ziana4383@gmail.com', 'loveleenkaur8285@gmail.com'
];

(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(`=== 🕵️ LEAD AUDIT: HIMANSHU SHARMA PAGES ===`);
    console.log(`Range: Since ${today.toLocaleString()} IST\n`);

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, status, source, assigned_to, created_at, users!leads_assigned_to_fkey(name, email, team_code)')
        .gte('created_at', today.toISOString())
        .or('source.ilike.%Himanshu%,source.ilike.%Digital Skills India%,source.ilike.%TFE 6444%');

    if (error) {
        console.error(error);
        return;
    }

    const stats = {
        Total: leads.length,
        Assigned: leads.filter(l => l.status === 'Assigned').length,
        Duplicate: leads.filter(l => l.status === 'Duplicate').length,
        Invalid: leads.filter(l => l.status === 'Invalid').length,
        Night_Backlog: leads.filter(l => l.status === 'Night_Backlog').length,
        Queued: leads.filter(l => l.status === 'Queued').length,
        Other: leads.filter(l => !['Assigned', 'Duplicate', 'Invalid', 'Night_Backlog', 'Queued'].includes(l.status)).length
    };

    console.log('Status Summary:');
    console.dir(stats);

    const allocation = {
        'Target 24 Boosters (TEAMFIRE)': 0,
        'Other TEAMFIRE (Deactivated Now)': 0,
        'TEAMSIMRAN': 0,
        'Other Teams': 0,
        'Unassigned': 0
    };

    const teamBreakdown = {};
    const userBreakdown = {};

    leads.forEach(l => {
        if (l.status === 'Assigned' && l.users) {
            const u = l.users;
            const team = u.team_code || 'No Team';
            teamBreakdown[team] = (teamBreakdown[team] || 0) + 1;

            if (team === 'TEAMFIRE') {
                if (TARGET_EMAILS.includes(u.email)) {
                    allocation['Target 24 Boosters (TEAMFIRE)']++;
                } else {
                    allocation['Other TEAMFIRE (Deactivated Now)']++;
                    userBreakdown[u.email] = { name: u.name, count: (userBreakdown[u.email]?.count || 0) + 1 };
                }
            } else if (team === 'TEAMSIMRAN') {
                allocation['TEAMSIMRAN']++;
            } else {
                allocation['Other Teams']++;
            }
        } else if (l.status === 'Assigned' && !l.users) {
            allocation['Unassigned']++;
        }
    });

    console.log('\nAllocation Breakdown:');
    console.table(allocation);

    console.log('\nTop 10 Other TEAMFIRE receivers (who took leads before deactivation):');
    Object.entries(userBreakdown)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .forEach(([email, data]) => {
            console.log(` - ${data.name} (${email}): ${data.count} leads`);
        });

    console.log('\nLeads breakdown by Team:');
    console.dir(teamBreakdown);

})();
