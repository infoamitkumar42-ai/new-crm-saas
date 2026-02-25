const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const boostersData = [
    { name: 'Ravenjeet Kaur', email: 'ravenjeetkaur@gmail.com', renewal: '2026-02-03', quota: 105 },
    { name: 'Rajni', email: 'vansh.rajni.96@gmail.com', renewal: '2026-01-30', quota: 105 },
    { name: 'Payal', email: 'payalpuri3299@gmail.com', renewal: '2026-02-04', quota: 105 },
    { name: 'Princy', email: 'princyrani303@gmail.com', renewal: '2026-02-05', quota: 98 },
    { name: 'Ansh', email: 'aansh8588@gmail.com', renewal: '2026-02-08', quota: 105 },
    { name: 'Nitinluthra', email: 'nitinanku628@gmail.com', renewal: '2026-02-10', quota: 105 },
    { name: 'Saijel Goel', email: 'saijelgoel4@gmail.com', renewal: '2026-02-03', quota: 105 },
    { name: 'Navpreet kaur', email: 'navpreetkaur95271@gmail.com', renewal: '2026-02-04', quota: 105 },
    { name: 'Rajinder', email: 'officialrajinderdhillon@gmail.com', renewal: '2026-02-03', quota: 105 },
    { name: 'Prince', email: 'prince@gmail.com', renewal: '2026-02-09', quota: 105 },
    { name: 'Jaspreet Kaur', email: 'jaspreetkaursarao45@gmail.com', renewal: '2026-02-04', quota: 105 },
    { name: 'Sameer', email: 'rupanasameer551@gmail.com', renewal: '2026-02-08', quota: 105 },
    { name: 'MOHIT LUDHRANI', email: 'ludhranimohit91@gmail.com', renewal: '2026-02-03', quota: 105 },
    { name: 'Komal', email: 'goldymahi27@gmail.com', renewal: '2026-02-05', quota: 105 },
    { name: 'Amritpal Kaur', email: 'amritpalkaursohi358@gmail.com', renewal: '2026-02-03', quota: 105 },
    { name: 'VEERPAL KAUR', email: 'surjitsingh1067@gmail.com', renewal: '2026-02-04', quota: 105 },
    { name: 'Mandeep kaur', email: 'mandeepbrar1325@gmail.com', renewal: '2026-02-02', quota: 155 },
    { name: 'Jashandeep kaur', email: 'jk419473@gmail.com', renewal: '2026-02-03', quota: 98 },
    { name: 'Vinita punjabi', email: 'punjabivinita@gmail.com', renewal: '2026-02-06', quota: 105 },
    { name: 'Ajay kumar', email: 'ajayk783382@gmail.com', renewal: '2026-02-07', quota: 105 },
    { name: 'SAMAN', email: 'samandeepkaur1216@gmail.com', renewal: '2026-02-14', quota: 105 },
    { name: 'Rohit Kumar', email: 'rohitgagneja69@gmail.com', renewal: '2026-02-04', quota: 105 },
    { name: 'Nazia Begam', email: 'ziana4383@gmail.com', renewal: '2026-02-04', quota: 105 },
    { name: 'Loveleen kaur', email: 'loveleenkaur8285@gmail.com', renewal: '2026-02-12', quota: 105 }
];

(async () => {
    let totalP = 0, totalR = 0, totalPending = 0;
    const recDate = '2026-02-17T12:00:00Z'; // Mid-day Feb 17
    let recLeads = 0;

    for (const b of boostersData) {
        const { data: u } = await supabase.from('users').select('id').eq('email', b.email).single();
        if (!u) continue;

        const { count: cUsed } = await supabase.from('leads').select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id).gte('created_at', b.renewal + 'T00:00:00Z');

        const { count: cRec } = await supabase.from('leads').select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id).gte('created_at', recDate);

        const used = cUsed || 0;
        recLeads += (cRec || 0);
        const pend = Math.max(0, b.quota - used);

        totalP += b.quota;
        totalR += used;
        totalPending += pend;
    }

    console.log('--- 🛡️ FINAL 10x BOOSTER SUMMARY 🛡️ ---');
    console.log('1. Booster Total Plan Quota (Sum):', totalP);
    console.log('2. Booster Leads Used since Feb Renewals:', totalR);
    console.log('3. TRUE PENDING BOOSTER LEADS RIGHT NOW:', totalPending);
    console.log('\n--- RECENT ACTIVITY VERIFICATION ---');
    console.log(`4. Leads assigned to Boosters since ${recDate}:`, recLeads);

    // Check if 906 - 495 approx = current pending or something
    console.log(`\nIf original goal thha 906 + ~495 = ${906 + recLeads}?`);
    console.log(`User says they gave 495 leads. RecLeads is: ${recLeads}`);
})();
