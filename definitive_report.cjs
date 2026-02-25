const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const boosterData = [
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
    console.log('--- 🚀 ABSOLUTE FINAL AUDIT: HIMANSHU & SIMRAN ---');

    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .in('team_code', ['TEAMFIRE', 'TEAMSIMRAN']);

    if (error) { console.error(error); return; }

    const report = [];

    for (const u of users) {
        let quota = u.total_leads_promised || 0;
        let received = u.total_leads_received || 0;
        let type = u.plan_name || 'none';

        // Special logic for the 24 boosters
        const booster = boosterData.find(b => b.email === u.email);
        if (booster) {
            const { count } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_to', u.id)
                .gte('created_at', booster.renewal + 'T00:00:00Z');

            received = count || 0;
            quota = booster.quota;
            type = booster.type + ' (Booster)';
        }

        const pending = Math.max(0, quota - received);
        const isQuotaFull = pending <= 0 && quota > 0;

        report.push({
            name: u.name,
            email: u.email,
            team: u.team_code,
            type: type,
            active: u.is_active,
            quota: quota,
            received: received,
            pending: pending,
            full: isQuotaFull
        });
    }

    // FILTER 1: Currently ACTIVE people
    const activePeople = report.filter(r => r.active);
    console.log(`\n1. CURRENTLY ACTIVE USERS IN CRM: ${activePeople.length}`);
    console.table(activePeople.map(p => ({ Name: p.name, Team: p.team, Pending: p.pending, Full: p.full })));

    // FILTER 2: People WHO SHOULD BE ACTIVE (Inactive but Pending > 0)
    const inactivePending = report.filter(r => !r.active && r.pending > 0);
    console.log(`\n2. INACTIVE USERS WHO STILL NEED LEADS: ${inactivePending.length}`);

    // FILTER 3: THE TARGET POOL (Active Pending + Inactive Pending)
    const totalTargetPool = report.filter(r => r.pending > 0);
    console.log(`\n3. TOTAL TARGET POOL (Anyone with pending leads): ${totalTargetPool.length}`);

    // FILTER 4: DONE BOOSTERS (People among the 24 who are full)
    const boostersReport = report.filter(r => boosterData.some(b => b.email === r.email));
    const doneBoosters = boostersReport.filter(r => r.full);
    console.log(`\n4. BOOSTERS (OUT OF 24) WHO COMPLETED QUOTA: ${doneBoosters.length}`);
    doneBoosters.forEach(b => console.log(` - ${b.name} (${b.received}/${b.quota})`));

    // Summary for Dada
    console.log('\n--- 🏁 FINAL RECONCILIATION FOR DADA ---');
    console.log(`- Himanshu Team Target Pool (Pending > 0): ${totalTargetPool.filter(r => r.team === 'TEAMFIRE').length}`);
    console.log(`- Simran Team Target Pool (Pending > 0): ${totalTargetPool.filter(r => r.team === 'TEAMSIMRAN').length}`);
    console.log(`- Active Boosters needing leads: ${boostersReport.filter(r => r.active && r.pending > 0).length}`);

})();
