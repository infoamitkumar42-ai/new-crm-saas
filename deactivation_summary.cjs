const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('--- 📊 DEACTIVATION SUMMARY: TEAMFIRE ---');

    const { data: users, error } = await supabase
        .from('users')
        .select('name, email, plan_name, is_active, updated_at')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', false)
        .gte('updated_at', '2026-02-18T00:00:00Z');

    if (error) {
        console.error(error);
        return;
    }

    const stats = {
        yesterday: { total: 0, plans: {} },
        today: { total: 0, plans: {} }
    };

    const feb19Start = new Date('2026-02-19T00:00:00Z');

    users.forEach(u => {
        const updateDate = new Date(u.updated_at);
        const target = updateDate >= feb19Start ? stats.today : stats.yesterday;

        target.total++;
        const plan = u.plan_name || 'No Plan';
        target.plans[plan] = (target.plans[plan] || 0) + 1;
    });

    console.log('\n[Yesterday - Feb 18]');
    console.log(`Total Deactivated: ${stats.yesterday.total}`);
    console.table(stats.yesterday.plans);

    console.log('\n[Today - Feb 19]');
    console.log(`Total Deactivated: ${stats.today.total}`);
    console.table(stats.today.plans);

    console.log('\nRecent Deactivations (Today):');
    const todayList = users
        .filter(u => new Date(u.updated_at) >= feb19Start)
        .map(u => `- ${u.name} (${u.email}) | Plan: ${u.plan_name}`);

    if (todayList.length > 0) {
        console.log(todayList.join('\n'));
    } else {
        console.log('None.');
    }

})();
