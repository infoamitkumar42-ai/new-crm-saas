const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const TEAM = 'TEAMFIRE';

const TARGET_USERS = [
    { email: 'ravenjeetkaur@gmail.com', pending: 31 },
    { email: 'vansh.rajni.96@gmail.com', pending: 5 },
    { email: 'payalpuri3299@gmail.com', pending: 30 },
    { email: 'princyrani303@gmail.com', pending: 53 },
    { email: 'aansh8588@gmail.com', pending: 65 },
    { email: 'nitinanku628@gmail.com', pending: 44 },
    { email: 'saijelgoel4@gmail.com', pending: 21 },
    { email: 'navpreetkaur95271@gmail.com', pending: 24 },
    { email: 'officialrajinderdhillon@gmail.com', pending: 23 },
    { email: 'prince@gmail.com', pending: 86 },
    { email: 'jaspreetkaursarao45@gmail.com', pending: 26 },
    { email: 'rupanasameer551@gmail.com', pending: 52 },
    { email: 'ludhranimohit91@gmail.com', pending: 20 },
    { email: 'goldymahi27@gmail.com', pending: 47 },
    { email: 'amritpalkaursohi358@gmail.com', pending: 25 },
    { email: 'surjitsingh1067@gmail.com', pending: 26 },
    { email: 'mandeepbrar1325@gmail.com', pending: 11 },
    { email: 'jk419473@gmail.com', pending: 35 },
    { email: 'punjabivinita@gmail.com', pending: 36 },
    { email: 'ajayk783382@gmail.com', pending: 41 },
    { email: 'samandeepkaur1216@gmail.com', pending: 82 },
    { email: 'rohitgagneja69@gmail.com', pending: 21 },
    { email: 'ziana4383@gmail.com', pending: 25 },
    { email: 'loveleenkaur8285@gmail.com', pending: 77 }
];

(async () => {
    console.log(`=== 🚀 EXECUTING DAY 1 BULK SYNC: ${TEAM} ===`);

    const targetEmails = TARGET_USERS.map(u => u.email.toLowerCase());

    // 1. Deactivate all non-target users in TEAMFIRE
    console.log(`Deactivating non-booster members in ${TEAM}...`);
    const { error: deactiveError } = await supabase
        .from('users')
        .update({ is_active: false, daily_limit: 0 })
        .eq('team_code', TEAM)
        .not('email', 'in', `(${targetEmails.join(',')})`);

    if (deactiveError) {
        console.error('Error deactivating users:', deactiveError);
    }

    // 2. Sync counters for target users
    console.log(`Syncing counters for 24 target users...`);
    let successCount = 0;
    for (const target of TARGET_USERS) {
        const { error: updateError } = await supabase
            .from('users')
            .update({
                is_active: true,
                total_leads_received: 0,
                total_leads_promised: target.pending,
                daily_limit: 150, // High limit for bulk delivery
                leads_today: 0
            })
            .eq('email', target.email);

        if (updateError) {
            console.error(`Error updating ${target.email}:`, updateError);
        } else {
            console.log(`✅ Updated ${target.email}: Promised=${target.pending}`);
            successCount++;
        }
    }

    console.log(`\n--- EXECUTION SUMMARY ---`);
    console.log(`Users Successfully Synced: ${successCount}/24`);
    console.log(`Users Deactivated: All others in ${TEAM}`);
    console.log(`-------------------------\n`);

})();
