const { createClient } = require('@supabase/supabase-js');

// HARDCODED CREDENTIALS
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkOverage() {
    console.log('📊 CHECKING FOR LEAD OVERAGE (Today)...');

    // 1. Get Active Users
    const { data: users } = await supabase.from('users').select('id, name, email, daily_limit, plan_name').gt('daily_limit', 0);

    // 2. Count Today's Leads per User
    const today = new Date().toISOString().split('T')[0];
    const { data: leads } = await supabase.from('leads')
        .select('user_id')
        .gte('created_at', today);

    const counts = {};
    leads.forEach(l => {
        counts[l.user_id] = (counts[l.user_id] || 0) + 1;
    });

    let overageCount = 0;

    console.log(`\nScan Results (Today: ${today}):`);

    for (const u of users) {
        const actual = counts[u.id] || 0;
        const limit = u.daily_limit;

        // Check Overage
        if (actual > limit) {
            console.log(`⚠️ OVERAGE: ${u.name} (${u.plan_name})`);
            console.log(`   Limit: ${limit} | Actual: ${actual} | Excess: ${actual - limit}`);
            overageCount++;
        }
    }

    if (overageCount === 0) console.log('✅ No other overage found.');
    else console.log(`\n❌ Found ${overageCount} users with extra leads.`);
}

checkOverage();
