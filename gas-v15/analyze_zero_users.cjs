
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) process.exit(1);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function analyzeZeroUsers() {
    console.log('📊 Analyzing System Distribution by Plan...');

    // Fetch all active users
    const { data: users } = await supabase
        .from('users')
        .select('name, plan_name, leads_today')
        .eq('is_active', true);

    if (!users) return;

    // Categorize
    const stats = {
        total: users.length,
        with_leads: 0,
        zero_leads: 0,
        by_plan: {}
    };

    users.forEach(u => {
        const plan = (u.plan_name || 'Basic').trim();
        if (!stats.by_plan[plan]) stats.by_plan[plan] = { total: 0, filled: 0, empty: 0 };

        stats.by_plan[plan].total++;

        if (u.leads_today > 0) {
            stats.with_leads++;
            stats.by_plan[plan].filled++;
        } else {
            stats.zero_leads++;
            stats.by_plan[plan].empty++;
        }
    });

    console.log(`\n📈 Total Users: ${stats.total}`);
    console.log(`✅ Users with Leads: ${stats.with_leads}`);
    console.log(`❌ Users with 0 Leads: ${stats.zero_leads}`);

    console.log('\n🔍 Breakdown by Plan (Who got left behind?):');
    Object.keys(stats.by_plan).forEach(p => {
        const s = stats.by_plan[p];
        const percentFilled = Math.round((s.filled / s.total) * 100);
        console.log(`   - ${p.padEnd(15)}: Total ${s.total} | With Leads: ${s.filled} | Empty: ${s.empty} (${percentFilled}% Served)`);
    });
}

analyzeZeroUsers();
