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
    console.log('=== 🎯 HIMANSHU SOURCE: LIVE ASSIGNMENT AUDIT ===');

    const { data, error } = await supabase
        .from('leads')
        .select('name, source, status, created_at, users!leads_assigned_to_fkey(name, email, team_code)')
        .or('source.ilike.%Himanshu%,source.ilike.%TFE 6444%,source.ilike.%Digital Skills India%')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching leads:', error);
        return;
    }

    console.log('| Time (UTC) | Lead Name | Assigned To | Team | Target Booster? | Source |');
    console.log('|---|---|---|---|---|---|');

    data.forEach(l => {
        const email = l.users?.email;
        const isTarget = email ? TARGET_EMAILS.includes(email) : false;
        const team = l.users?.team_code || 'N/A';
        const assigned = l.users?.name || 'Unassigned';
        const time = new Date(l.created_at).toISOString().replace('T', ' ').substring(0, 19);

        console.log(`| ${time} | ${l.name} | ${assigned} | ${team} | ${isTarget ? '✅ YES' : '❌ NO'} | ${l.source} |`);
    });

    const targetCount = data.filter(l => l.users && TARGET_EMAILS.includes(l.users.email)).length;
    console.log(`\nAccuracy for Himanshu's last 10 leads: ${(targetCount / 10) * 100}% to Target Boosters`);
})();
