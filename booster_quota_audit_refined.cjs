const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const boosters = [
    { name: 'Ravenjeet Kaur', email: 'ravenjeetkaur@gmail.com', renewal: '2026-02-03', quota: 92, type: 'Weekly' },
    { name: 'Rajni', email: 'vansh.rajni.96@gmail.com', renewal: '2026-01-30', quota: 92, type: 'Weekly' },
    { name: 'Payal', email: 'payalpuri3299@gmail.com', renewal: '2026-02-04', quota: 92, type: 'Weekly' },
    { name: 'Princy', email: 'princyrani303@gmail.com', renewal: '2026-02-05', quota: 108, type: 'Turbo' },
    { name: 'Ansh', email: 'aansh8588@gmail.com', renewal: '2026-02-08', quota: 92, type: 'Weekly' },
    { name: 'Nitinluthra', email: 'nitinanku628@gmail.com', renewal: '2026-02-10', quota: 92, type: 'Weekly' },
    { name: 'Saijel Goel', email: 'saijelgoel4@gmail.com', renewal: '2026-02-03', quota: 92, type: 'Weekly' },
    { name: 'Navpreet kaur', email: 'navpreetkaur95271@gmail.com', renewal: '2026-02-04', quota: 92, type: 'Weekly' },
    { name: 'Rajinder', email: 'officialrajinderdhillon@gmail.com', renewal: '2026-02-03', quota: 92, type: 'Weekly' },
    { name: 'Prince', email: 'prince@gmail.com', renewal: '2026-02-09', quota: 92, type: 'Weekly' },
    { name: 'Jaspreet Kaur', email: 'jaspreetkaursarao45@gmail.com', renewal: '2026-02-04', quota: 92, type: 'Weekly' },
    { name: 'Sameer', email: 'rupanasameer551@gmail.com', renewal: '2026-02-08', quota: 92, type: 'Weekly' },
    { name: 'MOHIT LUDHRANI', email: 'ludhranimohit91@gmail.com', renewal: '2026-02-03', quota: 92, type: 'Weekly' },
    { name: 'Komal', email: 'goldymahi27@gmail.com', renewal: '2026-02-05', quota: 92, type: 'Weekly' },
    { name: 'Amritpal Kaur', email: 'amritpalkaursohi358@gmail.com', renewal: '2026-02-03', quota: 92, type: 'Weekly' },
    { name: 'VEERPAL KAUR', email: 'surjitsingh1067@gmail.com', renewal: '2026-02-04', quota: 92, type: 'Weekly' },
    { name: 'Mandeep kaur', email: 'mandeepbrar1325@gmail.com', renewal: '2026-02-02', quota: 92, type: 'Weekly' },
    { name: 'Jashandeep kaur', email: 'jk419473@gmail.com', renewal: '2026-02-03', quota: 108, type: 'Turbo' },
    { name: 'Vinita punjabi', email: 'punjabivinita@gmail.com', renewal: '2026-02-06', quota: 92, type: 'Weekly' },
    { name: 'Ajay kumar', email: 'ajayk783382@gmail.com', renewal: '2026-02-07', quota: 92, type: 'Weekly' },
    { name: 'SAMAN', email: 'samandeepkaur1216@gmail.com', renewal: '2026-02-14', quota: 92, type: 'Weekly' },
    { name: 'Rohit Kumar', email: 'rohitgagneja69@gmail.com', renewal: '2026-02-04', quota: 92, type: 'Weekly' },
    { name: 'Nazia Begam', email: 'ziana4383@gmail.com', renewal: '2026-02-04', quota: 92, type: 'Weekly' },
    { name: 'Loveleen kaur', email: 'loveleenkaur8285@gmail.com', renewal: '2026-02-12', quota: 92, type: 'Weekly' }
];

(async () => {
    const results = [];

    for (const b of boosters) {
        const { data: user } = await supabase.from('users').select('id').eq('email', b.email).single();
        if (!user) continue;

        const { count } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id)
            .gte('created_at', `${b.renewal}T00:00:00Z`);

        const received = count || 0;
        const pending = Math.max(0, b.quota - received);

        results.push({
            name: b.name,
            email: b.email,
            renewal: b.renewal.split('-').reverse().join('-'), // YYYY-MM-DD back to DD-MM-YYYY if user prefers? Actually user used DD-MM-YYYY in their request.
            type: b.type,
            quota: b.quota,
            received: received,
            pending: pending
        });
    }

    console.log('| Name | Email | Latest_Renewal | Plan_Type | Quota | Received_Since_Renew | Pending_Corrected |');
    console.log('|---|---|---|---|---|---|---|');
    results.forEach(r => {
        console.log(`| ${r.name} | ${r.email} | ${r.renewal} | ${r.type} | ${r.quota} | ${r.received} | ${r.pending} |`);
    });

})();
