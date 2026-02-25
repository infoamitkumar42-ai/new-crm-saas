const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

// THE VERIFIED 134-USER MANUAL LIST
const manualList = [
    { name: 'Jashandeep singh', email: 'jashanpreet0479@gmail.com', plan: 'starter', quota: 50, date: '2026-02-06' },
    { name: 'Ravenjeet Kaur', email: 'ravenjeetkaur@gmail.com', plan: 'weekly_boost', quota: 105, date: '2026-02-03' },
    { name: 'Rajni', email: 'vansh.rajni.96@gmail.com', plan: 'weekly_boost', quota: 105, date: '2026-01-30' },
    { name: 'Mandeep kaur', email: 'mandeep.k21@icloud.com', plan: 'supervisor', quota: 105, date: '2026-02-09' },
    { name: 'Sakshi', email: 'sakshidigra24@gmail.com', plan: 'starter', quota: 50, date: '2026-02-05' },
    { name: 'Husanpreet kaur', email: 'husanpreetkaur9899@gmail.com', plan: 'starter', quota: 50, date: '2026-02-14' },
    { name: 'Sonia Chauhan', email: 's73481109@gmail.com', plan: 'starter', quota: 50, date: '2026-02-04' },
    { name: 'Baljinder kaur', email: 'nikkibaljinderkaur@gmail.com', plan: 'starter', quota: 50, date: '2026-02-01' },
    { name: 'Mandeep kaur', email: 'gurnoor1311singh@gmail.com', plan: 'supervisor', quota: 105, date: '2026-02-04' },
    { name: 'Yash yadav', email: 'yy861880@gmail.com', plan: 'starter', quota: 50, date: '2026-02-03' },
    { name: 'Princy', email: 'princyrani303@gmail.com', plan: 'turbo_boost', quota: 98, date: '2026-02-05' },
    { name: 'Kiran Brar', email: 'brark5763@gmail.com', plan: 'starter', quota: 50, date: '2026-02-08' },
    { name: 'Payal', email: 'payalpuri3299@gmail.com', plan: 'weekly_boost', quota: 105, date: '2026-02-04' },
    { name: 'Davinderpal kaur', email: 'hansmanraj88@gmail.com', plan: 'starter', quota: 50, date: '2026-02-10' },
    { name: 'Nitinluthra', email: 'nitinanku628@gmail.com', plan: 'weekly_boost', quota: 105, date: '2026-02-10' },
    { name: 'SEEMA RANI', email: 'ssatnam41912@gmail.com', plan: 'starter', quota: 50, date: '2026-02-09' },
    { name: 'Ansh', email: 'aansh8588@gmail.com', plan: 'weekly_boost', quota: 105, date: '2026-02-08' },
    { name: 'Manish', email: 'my440243@gmail.com', plan: 'starter', quota: 50, date: '2026-02-12' },
    { name: 'Preeti', email: 'preetibrarbrar7@gmail.com', plan: 'starter', quota: 50, date: '2026-02-04' },
    { name: 'Saloni', email: 'ananyakakkar53b@gmail.com', plan: 'supervisor', quota: 105, date: '2026-02-01' },
    { name: 'Saijel Goel', email: 'saijelgoel4@gmail.com', plan: 'weekly_boost', quota: 105, date: '2026-02-03' },
    { name: 'Navpreet kaur', email: 'navpreetkaur95271@gmail.com', plan: 'weekly_boost', quota: 105, date: '2026-02-04' },
    { name: 'Kulwant Singh', email: 'kulwantsinghdhaliwalsaab668@gmail.com', plan: 'supervisor', quota: 115, date: '2026-02-12' },
    { name: 'Priyanka', email: 'harjinderkumarkumar56@gmail.com', plan: 'starter', quota: 50, date: '2026-02-09' },
    { name: 'Gurdeep Singh', email: 'gurdeepgill613@gmail.com', plan: 'starter', quota: 50, date: '2026-02-14' },
    { name: 'Resham kaur', email: 'reshamkaur6@gmail.com', plan: 'starter', quota: 50, date: '2026-02-06' },
    { name: 'Arshdeep singh', email: 'arshdeepjnvkauni1606@gmail.com', plan: 'starter', quota: 50, date: '2026-02-08' },
    { name: 'Rajinder', email: 'officialrajinderdhillon@gmail.com', plan: 'weekly_boost', quota: 105, date: '2026-02-03' },
    { name: 'Jasmeen singh', email: 'jasmeensingh188@gmail.com', plan: 'starter', quota: 50, date: '2026-02-03' },
    { name: 'Sujal Sankhla', email: 'sujalsankhla11@gmail.com', plan: 'supervisor', quota: 105, date: '2026-02-04' },
    { name: 'Prince', email: 'prince@gmail.com', plan: 'weekly_boost', quota: 105, date: '2026-02-09' },
    { name: 'Sonali', email: 'chaurasiyasonali56@gmail.com', plan: 'starter', quota: 50, date: '2026-02-03' },
    { name: 'Priya Arora', email: 'priyaarora50505@gmail.com', plan: 'starter', quota: 50, date: '2026-02-13' },
    { name: 'Jyoti', email: 'rimpy7978@gmail.com', plan: 'starter', quota: 50, date: '2026-02-04' },
    { name: 'Sameer', email: 'rupanasameer551@gmail.com', plan: 'weekly_boost', quota: 105, date: '2026-02-08' },
    { name: 'Pooja jolly', email: 'jollypooja5@gmail.com', plan: 'starter', quota: 50, date: '2026-02-12' },
    { name: 'Jaspreet Kaur', email: 'jaspreetkaursarao45@gmail.com', plan: 'weekly_boost', quota: 105, date: '2026-02-04' },
    { name: 'Manjinder', email: 'rajveerbrarbrar637@gmail.com', plan: 'starter', quota: 50, date: '2026-02-02' },
    { name: 'Komal', email: 'goldymahi27@gmail.com', plan: 'weekly_boost', quota: 105, date: '2026-02-05' },
    { name: 'Swati', email: 'sainsachin737@gmail.com', plan: 'supervisor', quota: 105, date: '2026-02-11' },
    { name: 'ranjodh singh', email: 'ranjodhmomi@gmail.com', plan: 'supervisor', quota: 105, date: '2026-02-04' },
    { name: 'Loveleen', email: 'loveleensharma530@gmail.com', plan: 'starter', quota: 50, date: '2026-02-03' },
    { name: 'MOHIT LUDHRANI', email: 'ludhranimohit91@gmail.com', plan: 'weekly_boost', quota: 105, date: '2026-02-03' },
    { name: 'Harpreet kaur', email: 'harpreetk61988@gmail.com', plan: 'supervisor', quota: 105, date: '2026-02-04' },
    { name: 'Gurteshwar Singh', email: 'gurteshwargill098@gmail.com', plan: 'supervisor', quota: 105, date: '2026-02-05' },
    { name: 'PARAMJIT KAUR', email: 'paramjitkaur20890@gmail.com', plan: 'starter', quota: 50, date: '2026-02-04' },
    { name: 'Tanu Dhawan', email: 'dhawantanu536@gmail.com', plan: 'manager', quota: 160, date: '2026-02-13' },
    { name: 'Gurpreet kaur', email: 'gjama1979@gmail.com', plan: 'starter', quota: 50, date: '2026-02-10' },
    { name: 'Amritpal Kaur', email: 'amritpalkaursohi358@gmail.com', plan: 'weekly_boost', quota: 105, date: '2026-02-03' },
    { name: 'Arshdeep kaur', email: 'arshkaur6395@gmail.com', plan: 'starter', quota: 100, date: '2026-02-12' },
    { name: 'Navjot Kaur', email: 'knavjotkaur113@gmail.com', plan: 'starter', quota: 50, date: '2026-02-09' },
    { name: 'Sandeep Rehaan', email: 'sipreet73@gmail.com', plan: 'starter', quota: 50, date: '2026-02-09' },
    { name: 'Mandeep kaur', email: 'mandeepkau340@gmail.com', plan: 'manager', quota: 160, date: '2026-02-07' },
    { name: 'VEERPAL KAUR', email: 'surjitsingh1067@gmail.com', plan: 'weekly_boost', quota: 105, date: '2026-02-04' },
    { name: 'Mandeep kaur', email: 'mandeepbrar1325@gmail.com', plan: 'weekly_boost', quota: 155, date: '2026-02-02' },
    { name: 'MUSKAN', email: 'muskanchopra376@gmail.com', plan: 'starter', quota: 50, date: '2026-02-13' },
    { name: 'Jashandeep kaur', email: 'jk419473@gmail.com', plan: 'turbo_boost', quota: 98, date: '2026-02-03' },
    { name: 'Yuail arian', email: 'aryansandhu652@gmail.com', plan: 'starter', quota: 50, date: '2026-02-13' },
    { name: 'Kanchan sharma', email: 'sharmaanjali93962@gmail.com', plan: 'starter', quota: 50, date: '2026-02-05' },
    { name: 'Vinita punjabi', email: 'punjabivinita@gmail.com', plan: 'weekly_boost', quota: 105, date: '2026-02-06' },
    { name: 'Ajay kumar', email: 'ajayk783382@gmail.com', plan: 'weekly_boost', quota: 105, date: '2026-02-07' },
    { name: 'Akash', email: 'dbrar8826@gmail.com', plan: 'starter', quota: 50, date: '2026-02-05' },
    { name: 'Neha', email: 'neharajoria1543@gmail.com', plan: 'starter', quota: 50, date: '2026-02-15' },
    { name: 'Suman', email: 'sumansumankaur09@gmail.com', plan: 'starter', quota: 100, date: '2026-02-09' },
    { name: 'SAMAN', email: 'samandeepkaur1216@gmail.com', plan: 'weekly_boost', quota: 105, date: '2026-02-14' },
    { name: 'Rohit Kumar', email: 'rohitgagneja69@gmail.com', plan: 'weekly_boost', quota: 105, date: '2026-02-04' },
    { name: 'Harmandeep kaur', email: 'harmandeepkaurmanes790@gmail.com', plan: 'manager', quota: 160, date: '2026-02-13' },
    { name: 'Simran', email: 'ashok376652@gmail.com', plan: 'supervisor', quota: 105, date: '2026-02-05' },
    { name: 'Prabhjeet kaur', email: 'kaurdeep06164@gmail.com', plan: 'supervisor', quota: 105, date: '2026-02-06' },
    { name: 'Jasnoor Kaur', email: 'sranjasnoor11@gmail.com', plan: 'supervisor', quota: 105, date: '2026-02-02' },
    { name: 'Nazia Begam', email: 'ziana4383@gmail.com', plan: 'weekly_boost', quota: 105, date: '2026-02-04' },
    { name: 'Rajveer kaur', email: 'rajveerkhattra9999@gmail.com', plan: 'starter', quota: 50, date: '2026-02-03' },
    { name: 'Jashandeep Kaur', email: 'jashandeepkaur6444@gmail.com', plan: 'starter', quota: 50, date: '2026-02-04' },
    { name: 'Jasdeep Kaur', email: 'jasdeepsra68@gmail.com', plan: 'starter', quota: 50, date: '2026-02-03' },
    { name: 'Loveleen kaur', email: 'loveleenkaur8285@gmail.com', plan: 'weekly_boost', quota: 105, date: '2026-02-12' },
    { name: 'Manbir Singh', email: 'singhmanbir938@gmail.com', plan: 'supervisor', quota: 105, date: '2026-02-12' },
    // MANUAL ACTIVE CONFIRMED
    { name: 'Mandeep kaur', email: 'brarmandeepkaur7@gmail.com', plan: 'starter', quota: 50, date: '2026-02-01', manual: true },
    { name: 'Lakhveer kaur', email: 'lakhveerkaur219@gmail.com', plan: 'starter', quota: 50, date: '2026-02-01', manual: true },
    { name: 'Kiran', email: 'kiran@gmail.com', plan: 'starter', quota: 50, date: '2026-02-01', manual: true },
    { name: 'Shivani', email: 'shivanilead2026@gmail.com', plan: 'supervisor', quota: 105, date: '2026-02-01', manual: true }
];

(async () => {
    console.log('--- 🛡️ EXECUTE PRECISION SYNC (ALL USERS) 🛡️ ---');
    console.log('Target: Reset Quota to TRUE PENDING, Reset Received to 0.');
    console.log('Logic: If Pending > 0 -> Active; Else -> Inactive.\n');

    let totalSetPending = 0;
    let activatedCount = 0;
    let deactivatedCount = 0;

    for (const item of manualList) {
        // 1. Get User
        const { data: user } = await supabase.from('users').select('id, email, is_active, total_leads_promised, total_leads_received').eq('email', item.email).single();
        if (!user) {
            console.warn(`⚠️ User not found: ${item.email}`);
            continue;
        }

        // 2. Count ACTUAL leads since Feb/Date
        const { count } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id)
            .gte('created_at', item.date + 'T00:00:00Z');

        const leadsUsed = count || 0;
        const truePending = Math.max(0, item.quota - leadsUsed);

        // 3. ACTION: UPDATE DATABASE
        const shouldBeActive = truePending > 0;

        await supabase
            .from('users')
            .update({
                total_leads_promised: truePending,
                total_leads_received: 0, // RESET Counter
                is_active: shouldBeActive
            })
            .eq('id', user.id);

        console.log(`Synced ${item.name} (${item.email}):`);
        console.log(`   - Plan Quota: ${item.quota}`);
        console.log(`   - Leads Since ${item.date}: ${leadsUsed}`);
        console.log(`   - TRUE PENDING SENT TO DB: ${truePending}`);
        console.log(`   - Status: ${shouldBeActive ? '✅ ACTIVE' : '❌ INACTIVE'}`);

        totalSetPending += truePending;
        if (shouldBeActive) activatedCount++; else deactivatedCount++;
    }

    console.log('\n--- 🏁 EXECUTION COMPLETE ---');
    console.log(`Total System Target Established (Net Pending): ${totalSetPending}`);
    console.log(`Active Users: ${activatedCount}`);
    console.log(`Inactive Users: ${deactivatedCount}`);

})();
