
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Environment Variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkMorningLeaders() {
    console.log('🔍 Checking Morning Distribution Leaders...');

    // Fetch Users with leads_today > 0
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit, plan_name')
        .gt('leads_today', 0)
        .order('leads_today', { ascending: false });

    if (error) {
        console.error('❌ Error fetching users:', error.message);
        return;
    }

    if (users.length === 0) {
        console.log('✅ No leads distributed today yet.');
        return;
    }

    console.log('\n📊 **Morning Leaders Report (Target for Reset):**');
    console.log('----------------------------------------------------');
    console.log(`| ${'Name'.padEnd(20)} | ${'Leads'.padEnd(5)} | ${'Limit'.padEnd(5)} | ${'Plan'.padEnd(15)} |`);
    console.log('----------------------------------------------------');

    let totalMorningLeads = 0;

    users.forEach(u => {
        totalMorningLeads += u.leads_today;
        console.log(`| ${u.name.substring(0, 20).padEnd(20)} | ${u.leads_today.toString().padEnd(5)} | ${u.daily_limit.toString().padEnd(5)} | ${(u.plan_name || 'None').padEnd(15)} |`);
    });

    console.log('----------------------------------------------------');
    console.log(`\n🔹 Total Users with Leads: ${users.length}`);
    console.log(`🔹 Total Leads Consumed: ${totalMorningLeads}`);

    // Suggestion
    const leaders = users.filter(u => u.leads_today > 2);
    if (leaders.length > 0) {
        console.log(`\n⚠️ **Suggestion:** ${leaders.length} users have >2 leads. Resetting them to 2 will free up capacity.`);
        leaders.forEach(u => console.log(`   - ${u.name}: ${u.leads_today} -> 2`));
    } else {
        console.log('\n✅ All users are within 2 leads (Manual reset might not be strictly needed, but good for cleanliness).');
    }
}

checkMorningLeaders();
