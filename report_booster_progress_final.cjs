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

const INITIAL_PENDING = {
    'ravenjeetkaur@gmail.com': 31,
    'vansh.rajni.96@gmail.com': 5,
    'payalpuri3299@gmail.com': 30,
    'princyrani303@gmail.com': 53,
    'aansh8588@gmail.com': 65,
    'nitinanku628@gmail.com': 44,
    'saijelgoel4@gmail.com': 21,
    'navpreetkaur95271@gmail.com': 24,
    'officialrajinderdhillon@gmail.com': 23,
    'prince@gmail.com': 86,
    'jaspreetkaursarao45@gmail.com': 26,
    'rupanasameer551@gmail.com': 52,
    'ludhranimohit91@gmail.com': 20,
    'goldymahi27@gmail.com': 47,
    'amritpalkaursohi358@gmail.com': 25,
    'surjitsingh1067@gmail.com': 26,
    'mandeepbrar1325@gmail.com': 11,
    'jk419473@gmail.com': 35,
    'punjabivinita@gmail.com': 36,
    'ajayk783382@gmail.com': 41,
    'samandeepkaur1216@gmail.com': 82,
    'rohitgagneja69@gmail.com': 21,
    'ziana4383@gmail.com': 25,
    'loveleenkaur8285@gmail.com': 77
};

(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: users } = await supabase.from('users').select('id, name, email').in('email', TARGET_EMAILS);
    const { data: leads } = await supabase.from('leads').select('assigned_to').gte('created_at', today.toISOString()).not('assigned_to', 'is', null);

    const counts = {};
    leads.forEach(l => {
        counts[l.assigned_to] = (counts[l.assigned_to] || 0) + 1;
    });

    console.log('| Name | Initial Pending | Received Today | **Still Balance** |');
    console.log('|---|---|---|---|');

    users.sort((a, b) => (INITIAL_PENDING[b.email] - (counts[b.id] || 0)) - (INITIAL_PENDING[a.email] - (counts[a.id] || 0)));

    let totalRec = 0;
    let totalBal = 0;

    users.forEach(u => {
        const received = counts[u.id] || 0;
        const initial = INITIAL_PENDING[u.email] || 0;
        const balance = Math.max(0, initial - received);
        totalRec += received;
        totalBal += balance;
        console.log(`| ${u.name} | ${initial} | ${received} | **${balance}** |`);
    });

    console.log(`\n**TOTALS**`);
    console.log(`Leads Received Today: ${totalRec}`);
    console.log(`Remaining Balance: ${totalBal}`);

})();
