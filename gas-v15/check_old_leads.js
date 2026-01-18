import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkOldLeadAssignment() {
    console.log('\n🔍 --- CHECKING OLD LEAD ASSIGNMENT ---\n');

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get eligible users
    const { data: users } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit, valid_until, last_activity')
        .eq('is_active', true)
        .neq('plan_name', 'none');

    const eligible = users.filter(u => {
        const validUntil = u.valid_until ? new Date(u.valid_until) : null;
        const lastActivity = u.last_activity ? new Date(u.last_activity) : null;
        return validUntil && validUntil > now && lastActivity && lastActivity > sevenDaysAgo && u.daily_limit > 0;
    });

    const atLimit = eligible.filter(u => u.leads_today >= u.daily_limit);

    console.log(`Checking ${atLimit.length} users at daily limit...\n`);

    // For each user at limit, check lead dates
    const today = '2026-01-17';
    const results = [];

    for (const user of atLimit.slice(0, 40)) {
        const { data: userLeads } = await supabase
            .from('leads')
            .select('id, name, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (!userLeads || userLeads.length === 0) continue;

        const todayLeads = userLeads.filter(l => l.created_at.startsWith(today));
        const oldLeads = userLeads.filter(l => !l.created_at.startsWith(today));

        const oldestLead = userLeads[userLeads.length - 1];
        const oldestDate = new Date(oldestLead.created_at).toLocaleDateString('en-IN');

        results.push({
            name: user.name,
            total: userLeads.length,
            today: todayLeads.length,
            old: oldLeads.length,
            oldest: oldestDate
        });
    }

    console.log('📊 USERS AT LIMIT - LEAD AGE ANALYSIS:\n');
    console.table(results);

    const hasOldLeads = results.filter(r => r.old > 0);
    const onlyTodayLeads = results.filter(r => r.old === 0);

    console.log(`\n💡 SUMMARY:\n`);
    console.log(`   Users with OLD leads: ${hasOldLeads.length}`);
    console.log(`   Users with only TODAY leads: ${onlyTodayLeads.length}\n`);

    if (hasOldLeads.length > 0) {
        console.log(`❌ PROBLEM CONFIRMED!`);
        console.log(`   ${hasOldLeads.length} users got assigned OLD ORPHAN leads`);
        console.log(`   This filled their daily limits with week-old data!\n`);

        const totalOldAssigned = hasOldLeads.reduce((sum, r) => sum + r.old, 0);
        console.log(`   Total OLD leads assigned: ${totalOldAssigned}`);
        console.log(`   This is why daily limits are full! 😱\n`);
    }
}

checkOldLeadAssignment();
