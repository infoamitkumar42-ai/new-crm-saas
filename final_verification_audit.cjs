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

const HIMANSHU_KEYWORDS = ['TFE 6444', 'Himanshu Sharma', 'Work With Himanshu', 'Digital Skills India'];

(async () => {
    console.log('--- 📊 AUDIT REPORT: HIMANSHU LEAD DISTRIBUTION ---');

    const { data: leads, error } = await supabase
        .from('leads')
        .select(`
            id, name, source, status, created_at, 
            users!leads_assigned_to_fkey(name, email, team_code)
        `)
        .gte('created_at', '2026-02-18T00:00:00Z');

    if (error) {
        console.error('Error:', error);
        return;
    }

    // Filter for Himanshu's leads only
    const himanshuLeads = leads.filter(l => l.source && HIMANSHU_KEYWORDS.some(k => l.source.includes(k)));

    // Total counts
    const total = himanshuLeads.length;
    const nightBacklog = himanshuLeads.filter(l => l.status === 'Night_Backlog');
    const assigned = himanshuLeads.filter(l => l.status === 'Assigned' && l.users);

    console.log(`\nTotal Himanshu Leads Today: ${total}`);
    console.log(`Leads in Night_Backlog: ${nightBacklog.length}`);
    console.log(`Leads Successfully Assigned: ${assigned.length}`);

    // Distribution Breakdown
    const stats = {
        'Target 24 Boosters': 0,
        'Other TEAMFIRE (Non-Boosters)': 0,
        'Chirag Team (GJ01TEAMFIRE)': 0,
        'Simran Team (TEAMSIMRAN)': 0,
        'Other Teams': 0
    };

    const receivers = {};

    assigned.forEach(l => {
        const email = l.users.email;
        const team = l.users.team_code;
        const name = l.users.name;

        if (TARGET_EMAILS.includes(email)) {
            stats['Target 24 Boosters']++;
        } else if (team === 'TEAMFIRE') {
            stats['Other TEAMFIRE (Non-Boosters)']++;
        } else if (team === 'GJ01TEAMFIRE') {
            stats['Chirag Team (GJ01TEAMFIRE)']++;
        } else if (team === 'TEAMSIMRAN') {
            stats['Simran Team (TEAMSIMRAN)']++;
        } else {
            stats['Other Teams']++;
        }

        receivers[email] = { name, count: (receivers[email]?.count || 0) + 1, team };
    });

    console.log('\n--- Allocation Summary ---');
    console.table(stats);

    console.log('\n--- Night Leads Audit (Past 4 Hours) ---');
    const recentlyAssigned = assigned.filter(l => new Date(l.created_at) > new Date(Date.now() - 4 * 60 * 60 * 1000));
    console.log(`Leads assigned in last 4 hours: ${recentlyAssigned.length}`);
    recentlyAssigned.forEach(l => {
        const targetLabel = TARGET_EMAILS.includes(l.users.email) ? '✅ Target' : '❌ WRONG';
        console.log(`- Lead: ${l.name.padEnd(15)} | Assigned: ${l.users.name.padEnd(15)} | ${targetLabel} | Team: ${l.users.team_code}`);
    });

    if (stats['Chirag Team (GJ01TEAMFIRE)'] > 0) {
        console.log('\n--- Leads sent to Chirag Team ---');
        assigned.filter(l => l.users.team_code === 'GJ01TEAMFIRE').forEach(l => {
            console.log(`- Lead: ${l.name} | Source: ${l.source} | Assigned To: ${l.users.name}`);
        });
    }

})();
