const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const EMAILS = [
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
    console.log(`=== 📊 RECOVERY PROGRESS: BOOSTER BULK DELIVERY ===`);
    console.log(`Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST\n`);

    const { data: users, error } = await supabase
        .from('users')
        .select('name, email, total_leads_promised, total_leads_received, is_active')
        .in('email', EMAILS);

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    // Sort by pending (descending)
    users.sort((a, b) => (b.total_leads_promised - b.total_leads_received) - (a.total_leads_promised - a.total_leads_received));

    console.log('| Name | Target Quota | Received Today | **Still Pending** | Status |');
    console.log('|---|---|---|---|---|');

    let totalTarget = 0;
    let totalReceived = 0;

    users.forEach(u => {
        const remaining = Math.max(0, u.total_leads_promised - u.total_leads_received);
        totalTarget += u.total_leads_promised;
        totalReceived += u.total_leads_received;

        console.log(`| ${u.name} | ${u.total_leads_promised} | ${u.total_leads_received} | **${remaining}** | ${u.is_active ? '✅ Active' : '⏹️ Done'} |`);
    });

    console.log(`\n--- TOTALS ---`);
    console.log(`Total Target: ${totalTarget}`);
    console.log(`Total Delivered since 5 AM: ${totalReceived}`);
    console.log(`Balance Pending: ${totalTarget - totalReceived}`);
    console.log(`-------------------------\n`);

})();
