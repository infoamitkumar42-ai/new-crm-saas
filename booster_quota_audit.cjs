const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const boosters = [
    { name: 'Ravenjeet Kaur', email: 'ravenjeetkaur@gmail.com', renewal: '2026-02-03', quota: 92 },
    { name: 'Rajni', email: 'vansh.rajni.96@gmail.com', renewal: '2026-01-30', quota: 92 },
    { name: 'Payal', email: 'payalpuri3299@gmail.com', renewal: '2026-02-04', quota: 92 },
    { name: 'Princy', email: 'princyrani303@gmail.com', renewal: '2026-02-05', quota: 108 },
    { name: 'Ansh', email: 'aansh8588@gmail.com', renewal: '2026-02-08', quota: 92 },
    { name: 'Nitinluthra', email: 'nitinanku628@gmail.com', renewal: '2026-02-10', quota: 92 },
    { name: 'Saijel Goel', email: 'saijelgoel4@gmail.com', renewal: '2026-02-03', quota: 92 },
    { name: 'Navpreet kaur', email: 'navpreetkaur95271@gmail.com', renewal: '2026-02-04', quota: 92 },
    { name: 'Rajinder', email: 'officialrajinderdhillon@gmail.com', renewal: '2026-02-03', quota: 92 },
    { name: 'Prince', email: 'prince@gmail.com', renewal: '2026-02-09', quota: 92 },
    { name: 'Jaspreet Kaur', email: 'jaspreetkaursarao45@gmail.com', renewal: '2026-02-04', quota: 92 },
    { name: 'Sameer', email: 'rupanasameer551@gmail.com', renewal: '2026-02-08', quota: 92 },
    { name: 'MOHIT LUDHRANI', email: 'ludhranimohit91@gmail.com', renewal: '2026-02-03', quota: 92 },
    { name: 'Komal', email: 'goldymahi27@gmail.com', renewal: '2026-02-05', quota: 92 },
    { name: 'Amritpal Kaur', email: 'amritpalkaursohi358@gmail.com', renewal: '2026-02-03', quota: 92 },
    { name: 'VEERPAL KAUR', email: 'surjitsingh1067@gmail.com', renewal: '2026-02-04', quota: 92 },
    { name: 'Mandeep kaur', email: 'mandeepbrar1325@gmail.com', renewal: '2026-02-02', quota: 92 },
    { name: 'Jashandeep kaur', email: 'jk419473@gmail.com', renewal: '2026-02-03', quota: 108 },
    { name: 'Vinita punjabi', email: 'punjabivinita@gmail.com', renewal: '2026-02-06', quota: 92 },
    { name: 'Ajay kumar', email: 'ajayk783382@gmail.com', renewal: '2026-02-07', quota: 92 },
    { name: 'SAMAN', email: 'samandeepkaur1216@gmail.com', renewal: '2026-02-14', quota: 92 },
    { name: 'Rohit Kumar', email: 'rohitgagneja69@gmail.com', renewal: '2026-02-04', quota: 92 },
    { name: 'Nazia Begam', email: 'ziana4383@gmail.com', renewal: '2026-02-04', quota: 92 },
    { name: 'Loveleen kaur', email: 'loveleenkaur8285@gmail.com', renewal: '2026-02-12', quota: 92 }
];

(async () => {
    console.log('--- 📊 HIMANSHU BOOSTER QUOTA AUDIT (REAL-TIME) ---');

    const results = [];

    for (const b of boosters) {
        // 1. Get User ID
        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('email', b.email)
            .single();

        if (!user) {
            console.warn(`User not found: ${b.email}`);
            continue;
        }

        // 2. Count leads since renewal
        // We use renewal date + 'T00:00:00Z'
        const { count, error } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id)
            .gte('created_at', `${b.renewal}T00:00:00Z`);

        if (error) {
            console.error(`Error counting for ${b.email}:`, error);
            continue;
        }

        const receivedSinceRenew = count || 0;
        const pendingValue = b.quota - receivedSinceRenew;
        const pendingCorrected = pendingValue > 0 ? pendingValue : 0;
        const status = pendingValue <= 0 ? '✅ Completed' : '⏳ Pending';

        results.push({
            Name: b.name,
            Email: b.email,
            Renewal: b.renewal,
            Quota: b.quota,
            Received: receivedSinceRenew,
            Pending: pendingCorrected,
            Status: status
        });
    }

    console.table(results);

    // Markdown format for user
    console.log('\n| Name | Email | Latest_Renewal | Quota | Received | Pending | Status |');
    console.log('|---|---|---|---|---|---|---|');
    results.forEach(r => {
        console.log(`| ${r.Name} | ${r.Email} | ${r.Renewal} | ${r.Quota} | ${r.Received} | ${r.Pending} | ${r.Status} |`);
    });

})();
