
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeNavjot() {
    console.log("🕵️‍♀️ Analyzing Leads for 'knavjotkaur113@gmail.com'...\n");

    const email = 'knavjotkaur113@gmail.com';
    const resetTime = '2026-01-17T18:30:00.000Z'; // Today's Reset Time

    // 1. Get User
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !users) {
        // Fallback: Try searching by Name if email fails (Navjot Kaur)
        console.log("   ❌ Email not found directly. Searching by Name 'Navjot Kaur'...");
        const { data: usersByName } = await supabase.from('users').select('*').ilike('name', '%Navjot Kaur%');
        if (usersByName && usersByName.length > 0) {
            console.log(`   ✅ Found ${usersByName.length} user(s) with name 'Navjot Kaur'. Using the first one.`);
            return analyzeUser(usersByName[0]);
        }
        console.error("   ❌ User not found.");
        return;
    }

    await analyzeUser(users);
}

async function analyzeUser(user) {
    console.log(`👤 User: ${user.name} | ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Limit: ${user.daily_limit} | Leads Today (DB): ${user.leads_today}`);

    // 2. Total Lifetime Leads
    const { count: lifetimeCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id);

    // 3. Leads Assigned TODAY
    const resetTime = '2026-01-17T18:30:00.000Z';
    const { data: todayLeads } = await supabase
        .from('leads')
        .select('*')
        .eq('assigned_to', user.id)
        .gte('assigned_at', resetTime);

    const countToday = todayLeads.length;

    // 4. Breakdown: Old (Backlog) vs New
    // Logic: 
    // - "Old/Backlog" = We updated created_at to MATCH assigned_at exactly.
    // - "New" = created_at is different (earlier) than assigned_at.

    let oldBacklogCount = 0;
    let newFreshCount = 0;

    todayLeads.forEach(l => {
        const created = new Date(l.created_at).getTime();
        const assigned = new Date(l.assigned_at).getTime();

        // Tolerance for "Exact Match" (allowing small diff due to DB precision)
        // Check if diff is < 1000ms (1 second) -> Likely Backlog Fix
        if (Math.abs(assigned - created) < 2000) {
            oldBacklogCount++;
        } else {
            newFreshCount++;
        }
    });

    console.log(`\n📊 Analysis Report:`);
    console.log(`   ---------------------------------------`);
    console.log(`   🌍 Total Lifetime Leads:   ${lifetimeCount}`);
    console.log(`   📅 Leads Assigned Today:   ${countToday}`);
    console.log(`   ---------------------------------------`);
    console.log(`   📂 Breakdown of Today's ${countToday} Leads:`);
    console.log(`      🛑 Old/Backlog (Fixed): ${oldBacklogCount}`);
    console.log(`      🆕 New/Fresh Leads:     ${newFreshCount}`);
    console.log(`   ---------------------------------------`);

    if (user.leads_today !== countToday) {
        console.log(`\n⚠️ Mismatch Detected! User DB says ${user.leads_today}, Actual is ${countToday}.`);
        console.log(`   Running Quick Sync...`);
        await supabase.from('users').update({ leads_today: countToday }).eq('id', user.id);
        console.log(`   ✅ Synced.`);
    } else {
        console.log(`\n✅ Counter is Accurate.`);
    }
}

analyzeNavjot();
